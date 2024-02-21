import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { prisma } from '../utils/prisma/index.js';
import { ResumeController } from '../controller/resume.controller.js';
import { ResumeService } from '../service/resume.service.js';
import { ResumeRepository } from '../repositories/resume.repository.js';
const router = express.Router();
//게시물 작성 API(근데 이거 한 게시물에 사진 여러장 어떻게 넣지?)

// PostsController의 인스턴스를 생성합니다.

const resumeRepository = new ResumeRepository(prisma);
const resumeService = new ResumeService(resumeRepository);
const resumeController = new ResumeController(resumeService);
/** 이력서 목록 조회 API **/
router.get('/', authMiddleware, resumeController.findResumeList);

/** 이력서 상세 조회 API **/
router.get('/:resumeId', authMiddleware, resumeController.findResume);
/** 이력서 생성 API **/
router.post('/', authMiddleware, resumeController.createResume);

/** 이력서 수정 API **/
router.put('/:resumeId', authMiddleware, resumeController.updateResume);

/** 게시글 삭제 API **/
router.delete('/:resumeId', authMiddleware, resumeController.deleteResume);

export default router;
