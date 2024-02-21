import express from 'express';
import ResumeRouter from './resume.router.js';
import UsersRouter from './users.router.js';

const router = express.Router();
router.use('/resume', ResumeRouter);
router.use('/users', UsersRouter);
export default router;
