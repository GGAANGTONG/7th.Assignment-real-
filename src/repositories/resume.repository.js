export class ResumeRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }
  //1.이력서 목록 조회
  findResumeList = async (orderKey, orderValue) => {
    // ORM인 Prisma에서 Posts 모델의 create 메서드를 사용해 데이터를 요청합니다.
    let orders = '';
    if (orderKey === '' || orderKey === null || orderKey === undefined) {
      orders = 'userId';
    } else {
      orders = orderKey;
    }
    let orderBy = '';
    (() => {
      if (orderValue.toLowerCase() === 'asc') {
        return (orderBy = orderBy + 'asc');
      } else {
        return (orderBy = orderBy + 'desc');
      }
    })();

    const allResume = await this.prisma.resume.findMany({
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
      orderBy: {
        [orders]: orderBy,
      },
    });
    if (!allResume) {
      return { error: '해당하는 이력서가 존재하지 않습니다.' };
    }

    return allResume;
  };
  //2. 이력서 상세 조회
  findResume = async (userId, resumeId, email) => {
    // ORM인 Prisma에서 Posts 모델의 findMany 메서드를 사용해 데이터를 요청합니다.
    if (email === 'qkrds0914@gmail.com') {
      const resume = await this.prisma.resume.findFirst({
        where: {
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
    } else {
      const resume = await this.prisma.resume.findFirst({
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
    }
  };
  //3. 이력서 생성
  createResume = async (userId, name, title, introduction) => {
    const createdResume = await this.prisma.resume.create({
      data: {
        userId: +userId,
        author: name,
        title,
        introduction,
      },
    });

    console.log('1', createdResume);
    return {
      userId: createdResume.userId,
      title: createdResume.title,
      author: createdResume.name,
      introduction: createdResume.introduction,
    };
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
      const resume = await this.prisma.resume.findFirst({
        where: {
          userId: +userId,
          resumeId: +resumeId,
        },
      });

      if (!resume) return { error: '이력서 조회에 실패하였습니다.' };
      // ORM인 Prisma에서 Posts 모델의 findUnique 메서드를 사용해 데이터를 요청합니다.
      const updatedResume = await this.prisma.resume.update({
        where: { resumeId: +resumeId, userId: +userId },
        data: { title, introduction, status },
        select: {
          title: true,
          introduction: true,
          status: true,
          updatedAt: true,
        },
      });

      return {
        userId: updatedResume.userId,
        title: updatedResume.title,
        author: updatedResume.name,
        introduction: updatedResume.introduction,
      };
    } else if (email === 'qkrds0914@gmail.com') {
      const resume = await this.prisma.resume.findFirst({
        where: {
          resumeId: +resumeId,
        },
      });
      if (!resume) return { error: '해당 이력서가 존재하지 않습니다.' };
      const updatedResume = await this.prisma.resume.update({
        where: {
          resumeId: +resumeId,
        },
        data: {
          status,
        },
      });
      return {
        message: '이력서 현황 수정이 완료되었습니다.',
        updatedData: updatedResume.data,
      };
    }
  };
  //5. 이력서 삭제
  deleteResume = async (userId, resumeId) => {
    const resume = await this.prisma.resume.delete({
      where: {
        userId: +userId,
        resumeId: +resumeId,
      },
    });

    if (!resume) return { error: '해당하는 이력서가 존재하지 않습니다.' };
    return { message: '이력서가 성공적으로 삭제되었습니다.' };
  };
}
