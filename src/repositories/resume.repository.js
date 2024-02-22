import { dataSource } from '../typeorm/index.js';

export class ResumeRepository {
  //1.이력서 목록 조회
  findResumeList = async (orderKey, orderValue) => {
    // ORM인 Prisma에서 Posts 모델의 create 메서드를 사용해 데이터를 요청합니다.
    //typeorm은 orderBy가 아니라 order임
    let orders = '';
    if (orderKey === '' || orderKey === null || orderKey === undefined) {
      orders = 'userId';
    } else {
      orders = orderKey;
    }
    let order = '';
    (() => {
      if (orderValue.toLowerCase() === 'asc') {
        return (order = order + 'asc');
      } else {
        return (order = order + 'desc');
      }
    })();

    const allResume = await dataSource.getRepository('resume').find({
      select: {
        resumeId: true,
        title: true,
        introduction: true,
        author: {
          select: {
            users: {
              select: {
                userInfo: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        status: true,
        createdAt: true,
      },
      order: {
        [orders]: order,
      },
    });
    if (!allResume) {
      return { error: '해당하는 이력서가 존재하지 않습니다.' };
    }

    return allResume;
  };
  //2. 이력서 상세 조회
  findResume = async (userId, resumeId, email) => {
    //typeorm 문법
    const resume = dataSource.getRepository('resume').findOne({
      where: {
        userId: +userId,
        resumeId: +resumeId,
      },
      select: {
        resumeId: true,
        title: true,
        introduction: true,
        author: {
          select: {
            users: {
              select: {
                userInfo: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        status: true,
        createdAt: true,
      },
    });
    return resume;
  };
  //3. 이력서 생성
  createResume = async (userId, name, title, introduction) => {
    const data = {
      userId: +userId,
      author: name,
      title,
      introduction,
    };
    const createdResume = await dataSource.getRepository('resume').insert(data);

    return { message: '이력서가 생성되었습니다.' };
  };
  //4. 이력서 수정
  updateResume = async (
    userId,
    email,
    resumeId,
    title,
    introduction,
    status
  ) => {
    if (email !== 'qkrds0914@gmail.com') {
      const data = {
        title,
        introduction,
        status,
      };
      const resume = await dataSource.getRepository('resume').findOne({
        where: {
          userId: +userId,
          resumeId: +resumeId,
        },
      });

      if (!resume) return { error: '이력서 조회에 실패하였습니다.' };
      // ORM인 Prisma에서 Posts 모델의 findUnique 메서드를 사용해 데이터를 요청합니다.
      const updatedResume = await dataSource
        .getRepository('resume')
        .update({ resumeId: +resumeId, userId: +userId }, data);

      return { message: '이력서가 수정됐습니다.' };
    } else if (email === 'qkrds0914@gmail.com') {
      const data = {
        status,
      };
      const resume = await dataSource.getRepository('resume').findOne({
        resumeId: +resumeId,
      });
      if (!resume) return { error: '해당 이력서가 존재하지 않습니다.' };
      const updatedResume = await dataSource.getRepository('resume').update(
        {
          resumeId: +resumeId,
        },
        data
      );
      return {
        message: '이력서 현황 수정이 완료되었습니다.',
      };
    }
  };
  //5. 이력서 삭제
  deleteResume = async (userId, resumeId) => {
    const resume = await dataSource.getRepository('resume').delete({
      userId: +userId,
      resumeId: +resumeId,
    });

    if (!resume) return { error: '해당하는 이력서가 존재하지 않습니다.' };
    return { message: '이력서가 성공적으로 삭제되었습니다.' };
  };
}
