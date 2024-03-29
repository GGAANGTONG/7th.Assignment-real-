import express from 'express';
import { jest } from '@jest/globals';
import { ResumeRepository } from '../../src/repositories/resume.repository.js';
import errorHandlerMiddleware from '../../src/middlewares/error-handler.middleware.js';
const app = express();
app.use(errorHandlerMiddleware);

let mockPrisma = {
  resume: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

let resumeRepository = new ResumeRepository(mockPrisma);

describe('resume Repository Unit Test', () => {
  //각 테스트가 실행되기 전 모든 Mock 초기화
  beforeEach(() => {
    // 모든 Mock 초기화
    jest.resetAllMocks();
  });

  //1. 게시물 전체 조회
  test('findResumeList Method', async () => {
    // findMany Mock의 Return 값을 "findMany String"으로 설정합니다.
    const mockReturn = 'findMany String';
    mockPrisma.resume.findMany.mockReturnValue(mockReturn);
    const findResumeListParams = {
      orderKey: 'userId',
      orderValue: 'asc',
    };
    // resumeRepository의 findAllPosts Method를 호출합니다.
    const resume = await resumeRepository.findResumeList(
      findResumeListParams.orderKey,
      findResumeListParams.orderValue
    );

    // prisma.resumes의 findMany은 1번만 호출 되었습니다.
    expect(mockPrisma.resume.findMany).toHaveBeenCalledTimes(1);

    // mockPrisma의 Return과 출력된 findMany Method의 값이 일치하는지 비교합니다.
    expect(resume).toEqual(mockReturn);
  });

  //2. 이력서 상세 조회
  test('findResume Method', async () => {
    // findMany Mock의 Return 값을 "findMany String"으로 설정합니다.
    const mockReturn = 'find Method Return';
    mockPrisma.resume.findFirst.mockReturnValue(mockReturn);
    const findResumeParams = {
      userId: 1,
      resumeId: 1,
      email: 'qkrds0914@gmail.com',
    };

    // resumeRepository의 findAllPosts Method를 호출합니다.
    const resume = await resumeRepository.findResume(findResumeParams.resumeId);

    // prisma.resumes의 findFirst은 1번만 호출 되었습니다.

    expect(mockPrisma.resume.findFirst).toHaveBeenCalledTimes(1);

    // mockPrisma의 Return과 출력된 findMany Method의 값이 일치하는지 비교합니다.
    expect(resume).toBe(mockReturn);
  });

  //3. 이력서 생성
  test('createResume Method', async () => {
    // create Mock의 Return 값을 "create Return String"으로 설정합니다.

    // createPost Method를 실행하기 위해 필요한 Params 입니다.
    const createResumeParams = {
      userId: 1,
      name: 'create국밥',
      title: 'createPostTitle',
      introduction: 'createPostIntro',
    };
    mockPrisma.resume.create.mockReturnValue(createResumeParams);
    // resumeRepository의 createPost Method를 실행합니다.
    const createResumeData = await resumeRepository.createResume(
      createResumeParams.userId,
      createResumeParams.name,
      createResumeParams.title,
      createResumeParams.introduction
    );
    // createResumeData는 prisma.resumes의 create를 실행한 결과값을 바로 반환한 값인지 테스트합니다.
    expect(createResumeData).toEqual({
      userId: createResumeParams.userId,
      author: createResumeParams.name,
      title: createResumeParams.title,
      introduction: createResumeParams.introduction,
    });

    // resumeRepository의 createPost Method를 실행했을 때, prisma.resumes의 create를 1번 실행합니다.
    expect(mockPrisma.resume.create).toHaveBeenCalledTimes(1);

    // resumeRepository의 createPost Method를 실행했을 때, prisma.resumes의 create를 아래와 같은 값으로 호출합니다.
    expect(mockPrisma.resume.create).toHaveBeenCalledWith({
      data: {
        userId: createResumeParams.userId,
        author: createResumeParams.name,
        title: createResumeParams.title,
        introduction: createResumeParams.introduction,
      },
    });
  });

  //4. 이력서 수정
  test('updateResume Method', async () => {
    const ResumeParams = {
      userId: 1,
      email: 'gookbab0914@gmail.com',
      resumeId: 1,
      title: 'noPostTitle',
      introduction: 'noPostContent',
      status: 'APPLY',
    };

    const updateResumeParams = {
      userId: 1,
      email: 'gookbab0914@gmail.com',
      resumeId: 1,
      title: 'updatePostTitle',
      author: undefined,
      introduction: 'updatePostContent',
      status: 'APPLY',
    };

    mockPrisma.resume.findFirst.mockReturnValue(ResumeParams);
    mockPrisma.resume.update.mockReturnValue(updateResumeParams);

    // resumeRepository의 createPost Method를 실행합니다.
    const updateResumeData = await resumeRepository.updateResume(
      updateResumeParams.userId,
      updateResumeParams.email,
      updateResumeParams.resumeId,
      updateResumeParams.title,
      updateResumeParams.introduction,
      updateResumeParams.status
    );

    // updatePostData는 prisma.resumes의 create를 실행한 결과값을 바로 반환한 값인지 테스트합니다.
    expect(updateResumeData).toEqual({
      userId: updateResumeParams.userId,
      title: updateResumeParams.title,
      author: updateResumeParams.author,
      introduction: updateResumeParams.introduction,
    });

    // resumeRepository의 updatePost Method를 실행했을 때, prisma.resumes의 update를 1번 실행합니다.
    expect(mockPrisma.resume.update).toHaveBeenCalledTimes(1);

    // resumeRepository의 createPost Method를 실행했을 때, prisma.resumes의 update를 아래와 같은 값으로 호출합니다.
    expect(mockPrisma.resume.update).toHaveBeenCalledWith({
      where: {
        resumeId: updateResumeParams.resumeId,
        userId: updateResumeParams.userId,
      },
      data: {
        title: updateResumeParams.title,
        introduction: updateResumeParams.introduction,
        status: updateResumeParams.status,
      },
      select: {
        title: true,
        introduction: true,
        status: true,
        updatedAt: true,
      },
    });
  });

  //5. 게시물 삭제
  test('deleteResume Method', async () => {
    const mockReturn = { message: '이력서가 성공적으로 삭제되었습니다.' };
    mockPrisma.resume.delete.mockReturnValue(mockReturn);

    const deleteResumeParams = {
      userId: 1,
      resumeId: 1,
    };

    // resumeRepository의 createPost Method를 실행합니다.
    const deleteResumeData = await resumeRepository.deleteResume(
      deleteResumeParams.userId,
      deleteResumeParams.resumeId
    );

    // updatePostData는 prisma.resumes의 create를 실행한 결과값을 바로 반환한 값인지 테스트합니다.
    expect(deleteResumeData).toEqual(mockReturn);

    // resumeRepository의 updatePost Method를 실행했을 때, prisma.resumes의 update를 1번 실행합니다.
    expect(mockPrisma.resume.delete).toHaveBeenCalledTimes(1);

    // resumeRepository의 createPost Method를 실행했을 때, prisma.resumes의 update를 아래와 같은 값으로 호출합니다.
    expect(mockPrisma.resume.delete).toHaveBeenCalledWith({
      where: {
        userId: deleteResumeParams.userId,
        resumeId: deleteResumeParams.resumeId,
      },
    });
  });
});
