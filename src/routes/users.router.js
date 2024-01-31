import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import authMiddleware from '../middlewares/auth.middleware.js';
import queryString from 'querystring';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const router = express.Router();
app.use(cookieParser());

const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY; // Access Token의 비밀 키를 정의합니다.
//회원가입 API
router.post('/signUp', async (req, res, next) => {
  try {
    const { email, password, passwordCheck, name } = req.body;

    const isExistUser = await prisma.users.findFirst({
      where: { email },
    });

    if (isExistUser) throw new Error('이미 존재하는 회원정보입니다.');

    if (password !== passwordCheck)
      throw new Error('비밀번호를 다시 확인해 주세요.');
    else if (password.length < 6)
      throw new Error('비밀번호는 6자리 이상이여야 합니다.');
    const user = await prisma.users.create({
      data: {
        email,
        password,
      },
    });
    const userInfo = await prisma.userInfos.create({
      data: {
        userId: user.userId,
        name,
        passwordCheck,
      },
    });

    return res.status(200).json({
      message: '계정이 성공적으로 생성되었습니다.',
      data: {
        email: email,
        name: name,
      },
    });
    //에러 부분 손봐야 함
  } catch (error) {
    console.error(error);
    return res.json({
      message: error.name,
    });
  }
});
//로그인 API
router.post('/signIn', async (req, res, next) => {
  try {
    const { email, password } = req.body; //email, password
    const user = await prisma.users.findFirst({
      where: {
        email,
        password,
      },
    });
    const userInfo = await prisma.userInfos.findFirst({
      where: {
        userId: +user.userId,
      },
    });
    if (!user) throw new Error('에 해당하는 에러가 발생하였습니다.');

    //토큰을 발급하는 API는 로그인 API 하나임. 그렇기 때문에 ACCESSTOKEN은 여기서 발급돼야 함
    const accessToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,

        name: userInfo.name,
        password: user.password,
      },
      ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: '12h' }
    );
    //이거 쿠키 어디다 저장해야 되지?
    res.cookie('accessToken', accessToken);
    return res.status(200).json({
      message: '로그인에 성공하였습니다.',
    });
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: error.name });
  }
});

//내 정보 조회API
router.get('/myInfo', authMiddleware, async (req, res, next) => {
  //인증미들웨어를 거친 req.user를 객체구조분해할당을 해서 userId만 추출함
  const { userId } = req.user;
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
});
//모든 이력서 목록 조회 API
router.post('/allResume', authMiddleware, async (req, res, next) => {
  const allResume = await prisma.resume.findMany({
    select: {
      resumeId,
      title,
      introduction,
      author,
      status,
      createdAt,
    },
  });
});
//이력서 상세 조회 API
router.get('/myResume', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const resume = await prisma.resume.findFirst({
      where: {
        userId: +userId,
      },
      select: {
        resumeId: true,
        title: true,
        introduction: true,
        author: true,
        status: true,
        createdAt: true,
      },
    });
    return res.status(200).json({ data: resume });
  } catch (error) {
    console.error(error);
    return res.status(404).json({ message: error.name });
  }
});
//이력서 생성 API
router.post('/resume', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { name } = req.userInfo;
    const { title, introduction, author } = req.body;

    const resume = await prisma.resume.create({
      // where: {
      //   userId: +userId,
      // },
      data: {
        userId: +userId,
        title,
        author: name,
        introduction,
      },
    });

    return res.status(200).json({
      data: resume.data,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.name });
  }
});
//이력서 수정 API
router.put('/resume/:resumeId', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { resumeId } = req.params;
    const { title, introduction, status } = req.body;

    const resume = await prisma.resume.findFirst({
      where: {
        userId: +userId,
        resumeId: +resumeId,
      },
    });

    if (!resume) throw new Error('해당하는 이력서가 존재하지 않습니다.');

    const updatedResume = await prisma.resume.update({
      where: {
        userId: +userId,
        resumeId: +resumeId,
      },
      data: {
        title,
        introduction,
        status,
      },
    });
    return res.status(200).json({
      message: '이력서 수정이 완료되었습니다.',
      updatedData: updatedResume.data,
    });
  } catch (error) {
    console.error(error);
    return res.status(404).json({ message: error.name });
  }
});
//이력서 삭제 API

export default router;
