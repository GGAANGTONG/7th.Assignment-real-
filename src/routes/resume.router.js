import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const app = express();
const router = express.Router();

//이력서 목록 조회 API(O)
router.get('/allResume', authMiddleware, async (req, res, next) => {
  try {
    //직접 queryString을 지정 안해줘도 이렇게 하면 queryString이 url로 할당됨(url에는 직접 쳐야 함)
    const { orderKey, orderValue } = req.query;
    const { userId, email } = req.locals.user;

    //let orderBy = ''로 전역변수에 선언해버리니까, 지역 스코프에서 아무리 값을 바꿔놔도 나오면서 다 초기화돼버렸네
    //그게 아니라 걍 undefined가 돼버렸네 ㅋㅋㅋ
    //호출을 안한거였음...
    let orderBy = '';
    (() => {
      if (orderValue.toLowerCase() === 'asc') {
        return (orderBy = orderBy + 'asc');
      } else {
        return (orderBy = orderBy + 'desc');
      }
    })();
    //include아님, includes임
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
      if (!allResume) throw new Error('사용자의 이력서가 존재하지 않습니다.');
      return res.status(201).json({
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
      if (!allResume) throw new Error('사용자의 이력서가 존재하지 않습니다.');
      return res.status(201).json({
        data: allResume,
      });
    } else if (orderKey === undefined || +orderKey === 0 || orderKey === null) {
      return res
        .status(401)
        .json({ message: 'orderKey에 본인의 userId를 입력해 주세요.' });
    } else if (+orderKey !== +userId) {
      return res
        .status(419)
        .json({ message: 'orderKey가 본인의 userId가 맞는지 확인해 주세요.' });
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
        //orderBy 문법만 제대로 잡으면 댐!
        orderBy: {
          createdAt: orderBy,
        },
      });
      if (!allResume) throw new Error('사용자의 이력서가 존재하지 않습니다.');
      return res.status(201).json({
        data: allResume,
      });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(401)
      .json({ message: '해당 유저의 이력서를 조회할 수 없습니다.' });
  }
});

//이력서 상세 조회 API(ㅇ)
router.get('/myResume/:resumeId', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.locals.user;
    const { resumeId } = req.params;
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
  } catch (error) {
    console.error(error);
    return res.status(404).json({ message: error.name });
  }
});
//이력서 생성 API(ㅇ)
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
    console.error(error);
    return res.status(400).json({ message: error.name });
  }
});
//이력서 수정 API(ㅇ)
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

      if (!resume) throw new Error('해당하는 이력서가 존재하지 않습니다.');

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
      return res.status(200).json({
        message: '이력서 수정이 완료되었습니다.',
        updatedData: updatedResume.data,
      });
    } else if (email.includes('recruit')) {
      const resume = await prisma.resume.findFirst({
        where: {
          resumeId: +resumeId,
        },
      });
      if (!resume) throw new Error('해당하는 이력서가 존재하지 않습니다.');
      const updatedResume = await prisma.resume.update({
        where: {
          resumeId: +resumeId,
        },
        data: {
          status,
        },
      });
      return res.status(200).json({
        message: '이력서 현황 수정이 완료되었습니다.',
        updatedData: updatedResume.data,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(404).json({ message: error.name });
  }
});

//이력서 삭제 API(ㅇ)
router.delete(
  '/deleteMyResume/:resumeId',
  authMiddleware,
  async (req, res, next) => {
    const { userId } = req.locals.user;
    const { resumeId } = req.params;
    const resume = await prisma.resume.delete({
      where: {
        userId: +userId,
        resumeId: +resumeId,
      },
    });

    return res
      .status(201)
      .json({ message: '이력서가 성공적으로 삭제되었습니다.' });
  }
);

export default router;
