import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const transporter = nodemailer.createTransport({
  service: 'naver.com',
  host: 'smtp.naver.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  },
});

export default async function info(email, generatedAuthNumber) {
  await transporter.sendMail({
    // 보내는 곳의 이름과, 메일 주소를 입력
    from: `"ggangtong" <${process.env.NODEMAILER_USER}>`,
    // 받는 곳의 메일 주소를 입력
    to: email,
    // 보내는 메일의 제목을 입력
    subject: 'Login Authentication service',
    // 보내는 메일의 내용을 입력
    // text: 일반 text로 작성된 내용
    // html: html로 작성된 내용
    text: '사용자의 회원정보로 로그인을 위한 인증 시도가 감지되었습니다. 본인이 맞다면 아래의 번호를 입력해주세요.',
    html: `<b>${generatedAuthNumber}</b>`,
  });
}
