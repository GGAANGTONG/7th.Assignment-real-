import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import authMiddleware from '../middlewares/auth.middleware.js';
import errorHandlerMiddleware from '../middlewares/error-handler.middleware.js';
import axios from 'axios';
import joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const router = express.Router();
app.use(cookieParser());

const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY; // Access Token의 비밀 키를 정의합니다.
const REFRESH_TOKEN_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET_KEY;
const validationTest = joi.object({
  email: joi.string().email(),
});
//회원가입 API
router.post('/signUp', async (req, res, next) => {
  try {
    const { email, password, passwordCheck, name } = req.body;

    const validation = await validationTest.validateAsync({ email });

    if (!validation)
      return res
        .status(400)
        .json({ error: '이메일 형식이 맞는지 확인해 주세요.' });

    const isExistUser = await prisma.users.findFirst({
      where: { email },
    });

    if (isExistUser)
      return res.status(409).json({ error: '이미 존재하는 회원정보입니다.' });

    if (password.length < 6)
      return res
        .status(400)
        .json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' });

    if (password !== passwordCheck)
      return res.status(400).json({
        error: '비밀번호와 비밀번호 확인이 일치하는지 확인해 주세요.',
      });

    //bcrypt를 통한 암호화
    const hashedPassword = await bcrypt.hash(password, 15);
    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    const userInfo = await prisma.userInfos.create({
      data: {
        userId: user.userId,
        name,
        passwordCheck,
      },
    });

    return res.status(201).json({
      message: '계정이 성공적으로 생성되었습니다.',
      data: {
        email: email,
        name: name,
      },
    });
  } catch (error) {
    next(error);
  }
});
//로그인 API
router.post('/signIn', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.users.findFirst({
      where: {
        email,
      },
    });

    if (!user)
      return res
        .status(404)
        .json({ error: '로그인 정보를 다시 확인해 주세요' });

    if (!(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
    //토큰을 발급하는 API는 로그인 API 하나임. 그렇기 때문에 ACCESSTOKEN은 여기서 발급돼야 함
    const accessToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        password: user.password,
      },
      ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: '12h' }
    );
    const refreshToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        password: user.password,
      },
      REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: '7d' }
    );
    //객체 리터럴로 생성된 tokenStorage 객체에 refreshToken이란 key에 value를 집어넣어서 서버에 저장함
    //module.exports = {} 로 모듈화해서 쓰면 될듯
    // tokenStorage[refreshToken] = {
    //   userId: user.userId,
    //   email: user.email,
    //   //사용자 ip
    //   ip: req.ip,
    //   //사용자 user agent 정보
    //   userAgent: req.headers['user-agent'],
    // };
    const DBrefreshToken = await prisma.refreshToken.findFirst({
      where: {
        userId: user.userId,
      },
    });
    if (DBrefreshToken) {
      await prisma.refreshToken.delete({
        where: {
          userId: user.userId,
        },
      });
    }
    //아, 내가 default값 설정을 안해놔서 알아서 안들어오는구나!
    await prisma.refreshToken.create({
      data: {
        userId: user.userId,
        refreshToken,
        ip: req.ip,
        useragent: req.headers['user-agent'],
      },
    });
    await prisma.accessToken.create({
      data: {
        userId: user.userId,
        refreshToken,
        accessToken,
        reacquired: false,
        currentToken: true,
      },
    });
    res.cookie('accessToken', `Bearer ${accessToken}`);
    res.cookie('refreshToken', `Bearer ${refreshToken}`);
    return res.status(200).json({
      message: '로그인에 성공하였습니다.',
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

//카카오 로그인 연동 API
router.post('/SignIn-Kakao', async (req, res, next) => {
  try {
    //req.headers에 authorization이라는 값 자체가 없는데?
    //request를 보낼 떄 헤더에 설정을 해서 보내야 함
    //이건 우리 서버에서 정한 룰
    const header = req.headers['K-Authorization'];
    const kakaoToken =
      'Z4TeLayZ21zLz0KWXj3kKdv95DrLJ-55A40KPXRoAAABjWTwdYbo6jj-qNQmaA';
    //  header.split(' ')[1];

    //이건 kapi url쪽의 서버에서 정한 룰임
    //axios는 fetch처럼 호출하는 api
    //axios
    //axios를 통과하면 카카오 개발자 페이지에 있던 예제에 해당하는 json 정보들이 들어옴
    const result = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${kakaoToken}`,
      },
    });
    const { data } = result;
    const email = data.kakao_account.email;

    const user = await prisma.users.findFirst({
      where: {
        email,
      },
    });

    if (!user)
      return res
        .status(404)
        .json({ error: '해당하는 사용자가 존재하지 않습니다.' });

    const accessToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        password: user.password,
      },
      ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: '12h' }
    );
    const refreshToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        password: user.password,
      },
      REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: '7d' }
    );
    //객체 리터럴로 생성된 tokenStorage 객체에 refreshToken이란 key에 value를 집어넣어서 서버에 저장함
    //module.exports = {} 로 모듈화해서 쓰면 될듯
    // tokenStorage[refreshToken] = {
    //   userId: user.userId,
    //   email: user.email,
    //   //사용자 ip
    //   ip: req.ip,
    //   //사용자 user agent 정보
    //   userAgent: req.headers['user-agent'],
    // };
    const DBrefreshToken = await prisma.refreshToken.findFirst({
      where: {
        userId: user.userId,
      },
    });
    if (DBrefreshToken) {
      await prisma.refreshToken.delete({
        where: {
          userId: user.userId,
        },
      });
    }
    //아, 내가 default값 설정을 안해놔서 알아서 안들어오는구나!
    await prisma.refreshToken.create({
      data: {
        userId: user.userId,
        refreshToken,
        ip: req.ip,
        useragent: req.headers['user-agent'],
      },
    });
    await prisma.accessToken.create({
      data: {
        userId: user.userId,
        refreshToken,
        accessToken,
        reacquired: false,
        currentToken: true,
      },
    });

    res.cookie('accessToken', `Bearer ${accessToken}`);
    res.cookie('refreshToken', `Bearer ${refreshToken}`);
    return res.status(200).json({
      message: '로그인에 성공하였습니다.',
    });
  } catch (error) {
    next(error);
  }
});
//accessToken 재발급 확인 API
router.post('/accessTokenReacquire', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.locals.user;
    const accessTokenList = await prisma.accessToken.findMany({
      where: {
        userId: +userId,
      },
      select: {
        userId: true,
        accessTokenId: true,
        reacquired: true,
        currentToken: true,
      },
    });
    if (!accessTokenList) {
      res.status(401).json({ error: '잘못된 접근입니다.' });
    }
    return res.status(200).json({
      message: '회원님의 현재 accessToken 재발급 목록입니다(로그인 시 초기화).',
      data: accessTokenList,
    });
  } catch (error) {
    next(error);
  }
});

//내 정보 조회API
router.get('/myInfo', authMiddleware, async (req, res, next) => {
  //인증미들웨어를 거친 req.locals.user를 객체구조분해할당을 해서 userId만 추출함
  try {
    const { userId } = req.locals.user;
    const user = await prisma.users.findFirst({
      where: {
        //req로 오는건 죄다 json 타입으로 오니까 기본적으로 문자형임
        userId: +userId,
      },
      select: {
        userId: true,
        email: true,
        //이중 셀렉트 문법
        userInfo: {
          select: {
            name: true,
          },
        },
      },
    });
    return res.status(200).json({
      message: '회원님의 정보입니다.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

//회원정보 삭제 API
router.delete('/deleteMyInfo', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.locals.user;
    await prisma.users.delete({
      where: {
        userId: +userId,
      },
    });

    return res
      .status(200)
      .json({ message: '회원정보가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

export default router;
