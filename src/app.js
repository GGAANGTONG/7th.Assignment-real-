import express from 'express';
import dotenv from 'dotenv';
import UsersRouter from './routes/users.router.js';
import ResumeRouter from './routes/resume.router.js';
import errorHandlerMiddleware from './middlewares/error-handler.middleware.js';
import cookieParser from 'cookie-parser';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { prisma } from './utils/prisma/index.js';
import bcrypt from 'bcrypt';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());
const PORT = process.env.PORT;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Resume API',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.js'], // files containing annotations as above
};

const openapiSpecification = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

const admin = await prisma.users.findUnique({
  where: {
    userId: 1,
    email: 'qkrds0914@gmail.com',
  },
});
const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 15);
if (!admin) {
  const user = await prisma.users.create({
    data: {
      userId: 1,
      email: 'qkrds0914@gmail.com',
      password: hashedPassword,
    },
  });
  await prisma.userInfos.create({
    data: {
      userId: user.userId,
      name: 'admin',
    },
  });
}

app.get('/', (req, res) => {
  return { message: '국밥이여 영원하라!' };
});

app.use('/career', [UsersRouter, ResumeRouter]);

app.use(errorHandlerMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 어플리케이션이 실행되었습니다.');
});
