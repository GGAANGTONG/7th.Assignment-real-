import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();
//회원가입 API
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, passwordCheck, name } = req.body;

    const isExistUser = await prisma.users.findFirst({
      where: { email },
    });

    if (isExistUser)
      throw new Error(res.status(409), '이미 존재하는 회원정보입니다.');

    if (password !== passwordCheck)
      throw new Error(res.status(401), '비밀번호를 다시 확인해 주세요.');

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
  } catch (error) {
    console.error(error);
    return res.json({
      message: error.message,
    });
  }
});
//로그인 API
//내 정보 조회API
router.get('/users', (req, res, next) => {
  return console.log('국밥은 영원할 것이다!');
});

export default router;
//모든 이력서 목록 조회 API
//이력서 상세 조회 API
//이력서 생성 API
//이력서 수정 API
//이력서 삭제 API
