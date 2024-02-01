import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';
import errorHandlerMiddleware from '../middlewares/error-handler.middleware.js';
import dotenv from 'dotenv';

const app = express();
const router = express.Router();
dotenv.config();

const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY;
const REFRESH_TOKEN_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET_KEY;

export default async function (req, res, next) {
  try {
    const ip = req.ip;

    req.headers['Authorization'] = req.cookies;

    const useragent = req.headers['user-agent'];
    const { accessToken, refreshToken } = req.headers['Authorization'];

    if (
      accessToken.split(' ')[0] !== 'Bearer' ||
      refreshToken.split(' ')[0] !== 'Bearer'
    )
      return res.status(401).json({ error: '유효하지 않은 토큰 형식입니다.' });
    const accessTokenProcessed = accessToken.split(' ')[1];
    const refreshTokenProcessed = refreshToken.split(' ')[1];
    function validateToken(token, secretKey) {
      try {
        return jwt.verify(token, secretKey);
      } catch (error) {
        console.error(error);
        return null;
      }
    }
    const decodedToken = validateToken(
      accessTokenProcessed,
      ACCESS_TOKEN_SECRET_KEY
    );

    if (decodedToken) {
      //user.router.js의 로그인API에서 생성되어 넘어온 cookies의 userId 정보가 userId 상수에 할당됨
      const userId = decodedToken.userId;

      if (!userId)
        return res.status(401).json({ error: '승인되지 않은 접근입니다.' });
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
      if (!user)
        return res
          .status(401)
          .json({ error: '토큰 사용자가 존재하지 않습니다.' });
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
          .status(401)
          .json({ error: 'refresh Token이 존재하지 않습니다.' });
      }

      //2. refreshToken이 존재한다면, 유효여부 검증하고 복호화
      const verifiedRefreshToken = validateToken(
        refreshTokenProcessed,
        REFRESH_TOKEN_SECRET_KEY
      );
      if (!verifiedRefreshToken) {
        return res
          .status(401)
          .json({ error: 'refresh Token이 유효하지 않습니다.' });
      }

      //3. 복호화된 refreshtoken 정보가 db에 저장된 사용자 refreshtoken 정보와 맞는지 확인
      const DBrefreshToken = await prisma.refreshToken.findFirst({
        where: {
          userId: verifiedRefreshToken.userId,
        },
      });

      if (DBrefreshToken.ip !== ip || DBrefreshToken.useragent !== useragent) {
        return res.status(401).json({ error: '잘못된 접근입니다.' });
      }

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
            refreshToken: refreshTokenProcessed,
          },
        });
      } else {
        return res.status(401).json({ error: '잘못된 접근입니다.' });
      }

      const userId = jwt.verify(newAccessToken, ACCESS_TOKEN_SECRET_KEY).userId;

      if (!userId) return res.status(401).json({ error: '로그인을 해주세요!' });

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
      if (!user)
        return res
          .status(401)
          .json({ error: '토큰 사용자가 존재하지 않습니다.' });

      req.locals = {};
      req.locals.user = user;
      req.locals.userInfo = userInfo;
      next();
    }
  } catch (error) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
}
