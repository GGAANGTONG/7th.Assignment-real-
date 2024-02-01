import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import errorHandlerMiddleware from '../middlewares/error-handler.middleware.js';

const app = express();
const router = express.Router();

//이력서 목록 조회 API
router.get('/allResume', authMiddleware, async (req, res, next) => {
  try {
    const { orderKey, orderValue } = req.query;
    const { userId, email } = req.locals.user;

    let orderBy = '';
    (() => {
      if (orderValue.toLowerCase() === 'asc') {
        return (orderBy = orderBy + 'asc');
      } else {
        return (orderBy = orderBy + 'desc');
      }
    })();

    if (+orderKey === 0 && email.includes('recruit')) {
      const allResume = await prisma.resume.findMany({
        select: {
          resumeId: true,
          title: true,
          introduction: true,
          author: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: orderBy,
        },
      });
      if (!allResume)
        return res
          .status(404)
          .json({ error: '해당하는 이력서가 존재하지 않습니다.' });
      return res.status(200).json({
        data: allResume,
      });
    } else if (email.includes('recruit')) {
      const allResume = await prisma.resume.findMany({
        where: {
          userId: +orderKey,
        },
        select: {
          resumeId: true,
          title: true,
          introduction: true,
          author: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: orderBy,
        },
      });
      if (!allResume)
        return res
          .status(404)
          .json({ error: '해당하는 이력서가 존재하지 않습니다.' });
      return res.status(200).json({
        data: allResume,
      });
    } else if (orderKey === undefined || +orderKey === 0 || orderKey === null) {
      return res
        .status(400)
        .json({ error: 'orderKey에 본인의 userId를 입력해 주세요.' });
    } else if (+orderKey !== +userId) {
      return res
        .status(400)
        .json({ error: 'orderKey가 본인의 userId가 맞는지 확인해 주세요.' });
    } else {
      const allResume = await prisma.resume.findMany({
        where: {
          userId: +orderKey,
        },
        select: {
          resumeId: true,
          title: true,
          introduction: true,
          author: true,
          status: true,
          createdAt: true,
        },

        orderBy: {
          createdAt: orderBy,
        },
      });
      if (!allResume)
        return res
          .status(404)
          .json({ error: '해당하는 이력서가 존재하지 않습니다.' });
      return res.status(200).json({
        data: allResume,
      });
    }
  } catch (error) {
    next(error);
  }
});

//이력서 상세 조회 API
router.get('/myResume/:resumeId', authMiddleware, async (req, res, next) => {
  try {
    const { userId, email } = req.locals.user;
    const { resumeId } = req.params;
    if (email.includes('recruit')) {
      const resume = await prisma.resume.findFirst({
        where: {
          resumeId: +resumeId,
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
    } else {
      const resume = await prisma.resume.findFirst({
        where: {
          userId: +userId,
          resumeId: +resumeId,
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
    }
  } catch (error) {
    next(error);
  }
});
//이력서 생성 API
router.post('/resume', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.locals.user;
    const { name } = req.locals.userInfo;
    const { title, introduction } = req.body;

    const resume = await prisma.resume.create({
      data: {
        userId: +userId,
        title,
        author: name,
        introduction,
      },
    });

    return res.status(200).json({
      data: resume,
    });
  } catch (error) {
    next(error);
  }
});
//이력서 수정 API
router.put('/resume/:resumeId', authMiddleware, async (req, res, next) => {
  try {
    const { userId, email } = req.locals.user;
    const { resumeId } = req.params;
    const { title, introduction, status } = req.body;

    if (!email.includes('recruit')) {
      const resume = await prisma.resume.findFirst({
        where: {
          userId: +userId,
          resumeId: +resumeId,
        },
      });

      if (!resume)
        return res.status(404).json({ error: '이력서 조회에 실패하였습니다.' });

      const updatedResume = await prisma.resume.update({
        where: {
          userId: +userId,
          resumeId: +resumeId,
        },
        data: {
          title,
          introduction,
        },
      });
      return res.status(201).json({
        message: '이력서 수정이 완료되었습니다.',
        updatedData: updatedResume.data,
      });
    } else if (email.includes('recruit')) {
      const resume = await prisma.resume.findFirst({
        where: {
          resumeId: +resumeId,
        },
      });
      if (!resume)
        return res.status(404).json({ error: '이력서 조회에 실패하였습니다.' });
      const updatedResume = await prisma.resume.update({
        where: {
          resumeId: +resumeId,
        },
        data: {
          status,
        },
      });
      return res.status(201).json({
        message: '이력서 현황 수정이 완료되었습니다.',
        updatedData: updatedResume.data,
      });
    }
  } catch (error) {
    next(error);
  }
});

//이력서 삭제 API
router.delete(
  '/deleteMyResume/:resumeId',
  authMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.locals.user;
      const { resumeId } = req.params;
      const resume = await prisma.resume.delete({
        where: {
          userId: +userId,
          resumeId: +resumeId,
        },
      });

      if (!resume)
        return res
          .status(404)
          .json({ error: '해당하는 이력서가 존재하지 않습니다.' });

      return res
        .status(200)
        .json({ message: '이력서가 성공적으로 삭제되었습니다.' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
