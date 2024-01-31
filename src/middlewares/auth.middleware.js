import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY;
const REFRESH_TOKEN_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET_KEY;

//사용자 인증 미들웨어는 express 의존성이 존재하지 않는다고 함. 무슨 의미인지는 아직 잘 모름
export default async function (req, res, next) {
  try {
    //발급받은 cookies의 첫번째 프로퍼티를 객체분해할당으로 authorization 식별자에 할당해서 추출함

    const { accessToken, refreshToken } = req.cookies;

    function validateToken(token, secretKey) {
      try {
        return jwt.verify(token, secretKey);
      } catch (error) {
        console.error(error);
        return null;
      }
    }
    const decodedToken = validateToken(accessToken, ACCESS_TOKEN_SECRET_KEY);

    if (decodedToken) {
      //user.router.js의 로그인API에서 생성되어 넘어온 cookies의 userId 정보가 userId 상수에 할당됨
      const userId = decodedToken.userId;

      if (!userId) throw new Error('로그인을 해주세요!');
      //그리고 그 userId와 일치하는 userId를 가진 user를 찾아냄
      const user = await prisma.users.findFirst({
        where: {
          userId: +userId,
        },
      });
      const userInfo = await prisma.userInfos.findFirst({
        where: {
          userId: +userId,
        },
      });
      if (!user) throw new Error('토큰 사용자가 존재하지 않습니다.');
      //이후로 미들웨어에서 req를 통해 전달되는 모든 user는 바로 decodedToken을 타고 와 모든 인증을 거친 userId를 가진 user임
      req.user = user;
      req.userInfo = userInfo;
      next();
    }
    //accessToken이 존재하지 않거나, 유효하지 않은 경우 refreshToken을 사용해 재발급 받아야 함
    else if (!accessToken || !decodedToken) {
      //refreshToken  검증
      //1. refreshToken의 존재 여부 검증
      if (!refreshToken) {
        return res
          .status(400)
          .json({ errorMessage: 'refresh Token이 존재하지 않습니다.' });
      }
      //2. refreshtoken 정보가 db에 저장된 사용자 refreshtoken 정보와 맞는지 확인
      const { ip } = req.ip;
      const { useragent } = req.headers['user-agent'];

      const DBrefreshToken = await prisma.refreshToken.findFirst({
        userId: user.userId,
        refreshToken: refreshToken,
      });

      if (DBrefreshToken.ip !== ip || DBrefreshToken.useragent !== useragent) {
        return res.status(401).json({ message: '잘못된 접근입니다.' });
      }

      //3. refreshToken이 존재한다면, 유효여부 검증
      const verifiedRefreshToken = validateToken(
        refreshToken,
        REFRESH_TOKEN_SECRET_KEY
      );
      if (!verifiedRefreshToken) {
        return res
          .status(401)
          .json({ errorMessage: 'refresh Token이 유효하지 않습니다.' });
      }

      //3. tokenStorage[refreshToken] 정보가 있는지 여부 확인(어떻게 가져오지...)
      //미들웨어에 토큰 스토리지를 들고 오면 안댐(개인정보가 공통적으로 사용되는 미들웨어 상에서 노출돼버림), 필요하면 클라이언트에게 다시 요청하던가, 아니면 그냥 안해야 됨
      //accesstoken과 refreshtoken 안에 있는 유저 아이디로 데이터베이스 안에 있는 유저 정보를 가져오도록 설계해야 함
      // const userInformation = tokenStorage[refreshToken];
      // if (!userInformation)
      //   return res.status(419).json({
      //     errorMessage: 'refresh Token의 정보가 서버에 존재하지 않습니다.',
      //   });

      //refreshToken은 이미 jwt 문자열이라서 newAccessToken은 찍어봤자 아무것도 안나옴
      //jwt.verify >> 인증기능만 있는 줄 알았는데 복호화 기능이 같이 있었다!
      const newAccessToken = jwt.sign(
        {
          userId: verifiedRefreshToken.userId,
          email: verifiedRefreshToken.email,
          password: verifiedRefreshToken.password,
        },
        ACCESS_TOKEN_SECRET_KEY,
        { expiresIn: '3h' }
      );

      //user.router.js의 로그인API에서 생성되어 넘어온 cookies의 userId 정보가 userId 상수에 할당됨
      const userId = jwt.verify(newAccessToken, ACCESS_TOKEN_SECRET_KEY).userId;

      if (!userId) throw new Error('로그인을 해주세요!');
      //그리고 그 userId와 일치하는 userId를 가진 user를 찾아냄
      const user = await prisma.users.findFirst({
        where: {
          userId: +userId,
        },
      });
      const userInfo = await prisma.userInfos.findFirst({
        where: {
          userId: +userId,
        },
      });
      if (!user) throw new Error('토큰 사용자가 존재하지 않습니다.');
      //이후로 미들웨어에서 req를 통해 전달되는 모든 user는 바로 decodedToken을 타고 와 모든 인증을 거친 userId를 가진 user임
      req.user = user;
      req.userInfo = userInfo;
      next();
    }
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: error.name });
  }
}
