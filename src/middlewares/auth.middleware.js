import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';
import dotenv from 'dotenv';

const app = express();
const router = express.Router();
dotenv.config();

const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY;
const REFRESH_TOKEN_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET_KEY;

//사용자 인증 미들웨어는 express 의존성이 존재하지 않는다고 함. 무슨 의미인지는 아직 잘 모름
export default async function (req, res, next) {
  try {
    //발급받은 cookies의 첫번째 프로퍼티를 객체분해할당으로 authorization 식별자에 할당해서 추출함

    //req.ip 는 문자열로 반환돼서, 객체분해할당으로는 안됨. 그리고 req.ip 자체가 express에서 제공하는 거임
    const ip = req.ip;
    console.log('ip', ip);

    const useragent = req.headers['user-agent'];
    console.log('useragent', useragent);

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
      req.locals = {};
      req.locals.user = user;
      req.locals.userInfo = userInfo;
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

      //2. refreshToken이 존재한다면, 유효여부 검증하고 복호화
      const verifiedRefreshToken = validateToken(
        refreshToken,
        REFRESH_TOKEN_SECRET_KEY
      );
      if (!verifiedRefreshToken) {
        return res
          .status(401)
          .json({ errorMessage: 'refresh Token이 유효하지 않습니다.' });
      }

      //3. 복호화된 refreshtoken 정보가 db에 저장된 사용자 refreshtoken 정보와 맞는지 확인
      //얘 왜 널임? refreshToken 때문이었음 생각해보면 이걸 직접 비교하는건 에러뜨기 딱좋긴 함
      const DBrefreshToken = await prisma.refreshToken.findFirst({
        where: {
          userId: verifiedRefreshToken.userId,
        },
      });

      if (DBrefreshToken.ip !== ip || DBrefreshToken.useragent !== useragent) {
        return res.status(401).json({ message: '잘못된 접근입니다.' });
      }

      //* tokenStorage[refreshToken] 정보가 있는지 여부 확인(어떻게 가져오지...)
      //미들웨어에 토큰 스토리지를 들고 오면 안댐(개인정보가 공통적으로 사용되는 미들웨어 상에서 노출돼버림), 필요하면 클라이언트에게 다시 요청하던가, 아니면 그냥 안해야 됨
      //accesstoken과 refreshtoken 안에 있는 유저 아이디로 데이터베이스 안에 있는 유저 정보를 가져오도록 설계해야 함
      // const userInformation = tokenStorage[refreshToken];
      // if (!userInformation)
      //   return res.status(419).json({
      //     errorMessage: 'refresh Token의 정보가 서버에 존재하지 않습니다.',
      //   });

      //refreshToken은 이미 jwt 문자열이라서 newAccessToken은 찍어봤자 아무것도 안나옴
      //jwt.verify >> 인증기능만 있는 줄 알았는데 복호화 기능이 같이 있었다!
      //4. accessToken재발급
      const newAccessToken = jwt.sign(
        {
          userId: verifiedRefreshToken.userId,
          email: verifiedRefreshToken.email,
          password: verifiedRefreshToken.password,
        },
        ACCESS_TOKEN_SECRET_KEY,
        { expiresIn: '12h' }
      );

      const availableAccessToken = await prisma.accessToken.findFirst({
        where: { userId: verifiedRefreshToken.userId, currentToken: true },
      });
      if (availableAccessToken) {
        await prisma.accessToken.update({
          where: {
            accessTokenId: availableAccessToken.accessTokenId,
            userId: verifiedRefreshToken.userId,
            currentToken: true,
          },
          data: {
            currentToken: false,
          },
        });

        await prisma.accessToken.create({
          data: {
            userId: verifiedRefreshToken.userId,
            accessToken: newAccessToken,
            reacquired: true,
            currentToken: true,
            refreshToken,
          },
        });
      } else {
        throw new Error('잘못된 접근입니다.');
      }

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
      //req.locals는 그냥 신텍스적이다. req.locals가 아무런 값도 없어서 그랬던거.
      req.locals = {};
      req.locals.user = user;
      req.locals.userInfo = userInfo;
      next();
    }
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: error.name });
  }
}
