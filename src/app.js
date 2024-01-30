import express from 'express';
import dotenv from 'dotenv';
import UsersRouter from './routes/users.router.js';

dotenv.config();
const app = express();
app.use(express.json());
const PORT = process.env.PORT;

app.get('/', (req, res) => {
  return { message: '국밥이여 영원하라!' };
});

app.use('/career', [UsersRouter]);

app.listen(PORT, () => {
  console.log(PORT, '포트로 어플리케이션이 실행되었습니다.');
});
