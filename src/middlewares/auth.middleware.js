import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';

//사용자 인증 미들웨어는 express 의존성이 존재하지 않는다고 함. 무슨 의미인지는 아직 잘 모름
export default async function (req, res, next) {
  try {
    //발급받은 cookies의 첫번째 프로퍼티를 객체분해할당으로 authorization 식별자에 할당해서 추출함
    const { accessToken } = req.cookies;

    if (!accessToken)
      throw new Error('요청한 사용자의 토큰이 존재하지 않습니다.');
    //authorization의 secretkey와 서버에 저장된 secretkey 비교
    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET_KEY
    );
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
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: error.name });
  }
}
