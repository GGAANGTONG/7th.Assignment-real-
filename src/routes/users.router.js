import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import authMiddleware from '../middlewares/auth.middleware.js';
import ejs from 'ejs';
import path from 'path';
import { transporter } from './nodemailer.js';
import info from './nodemailer.js';
import axios from 'axios';
import joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const router = express.Router();
app.set('view engine', 'ejs');
app.set('views', path.join('src/views', 'views'));

const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY;
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
    await prisma.userInfos.create({
      data: {
        userId: user.userId,
        name,
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

//로그인 인증 API
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

    //nodemailer을 통한 로그인 인증

    transporter;

    const generatedAuthNumber = Math.floor(Math.random() * 10000 + 1);

    //인증 정보 db보관 전 기존 이메일 2차 인증 정보가 db안에 있을 경우 삭제
    const pastAuthData = await prisma.authentication.findUnique({
      where: {
        userId: user.userId,
      },
    });
    if (pastAuthData) {
      await prisma.authentication.delete({
        where: {
          userId: user.userId,
        },
      });
    }
    //인증 성공하기 전까지 인증 정보 db보관
    await prisma.authentication.create({
      data: {
        userId: user.userId,
        generatedAuthNumber,
      },
    });

    const authNumberDB = await prisma.authentication.findFirst({
      where: {
        userId: user.userId,
        generatedAuthNumber,
      },
    });
    //로그인 시도자가 입력하여 넘어온 난수 입력값을 확인하는 로직
    //AuthNumberFromEmail은 프론트엔드에서(클라이언트로부터) 넘어와야 하는 값
    const validationMail = info(email, generatedAuthNumber);
    const AuthNumberFromEmail = generatedAuthNumber;

    //이메일 인증
    if (authNumberDB.generatedAuthNumber !== AuthNumberFromEmail) {
      return res.status(400).json({ error: '인증번호가 일치하지 않습니다.' });
    } else if (authNumberDB === AuthNumberFromEmail) {
      //지금 생각해 보니, 인증을 안하고 재 로그인을 시도하는 사람을 구별해내기 위해서는 userId도 같이 받아야 할 거 같다.
      await prisma.authentication.delete({
        where: {
          userId: user.userId,
          generatedAuthNumber,
        },
      });
    }

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
    const DBaccessToken = await prisma.accessToken.findFirst({
      where: {
        userId: user.userId,
      },
    });

    if (DBaccessToken) {
      await prisma.accessToken.deleteMany({
        where: {
          userId: user.userId,
        },
      });
    }

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
        //데이터베이스 숙련도 이슈로 인해 빼기로 함. 어차피 userId로 서로 연관돼 있기 때문에 큰 문제 없을 듯
        // refreshToken,
        accessToken,
        reacquired: false,
        currentToken: true,
      },
    });
    res.cookie('accessToken', `Bearer ${accessToken}`);
    res.cookie('refreshToken', `Bearer ${refreshToken}`);
    res.header('userId', user.userId);
    return res.status(200).json({
      message: '로그인에 성공하였습니다.',
    });

    //클라이언트 요청 이벤트에 대한 서버 처리
    //res.render() 부분은 내가 아니라 프론트에서 처리해야 할 부분임. 일단은 건들지 말자
    // res.render('validation.ejs');
    //추가 비밀번호 인증을 위해(req-res를 한번 더 해야해서) validation.ejs로 리다이렉트
  } catch (error) {
    next(error);
  }
});

//카카오 로그인 연동 API
router.post('/SignIn-Kakao', async (req, res, next) => {
  try {
    const header = req.headers['K-Authorization'];
    const kakaoToken = header.split(' ')[1];

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
  try {
    const { userId } = req.locals.user;
    const user = await prisma.users.findFirst({
      where: {
        userId: +userId,
      },
      select: {
        userId: true,
        email: true,
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
