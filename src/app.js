import express from 'express';
import dotenv from 'dotenv';
import UsersRouter from './routes/users.router.js';
import ResumeRouter from './routes/resume.router.js';
import errorHandlerMiddleware from './middlewares/error-handler.middleware.js';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());
const PORT = process.env.PORT;

app.get('/', (req, res) => {
  return { message: '국밥이여 영원하라!' };
});

app.use('/career', [UsersRouter, ResumeRouter]);

app.use(errorHandlerMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 어플리케이션이 실행되었습니다.');
});
