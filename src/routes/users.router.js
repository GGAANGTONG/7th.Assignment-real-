import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import authMiddleware from '../middlewares/auth.middleware.js';
import ejs from 'ejs';
import path from 'path';
import { transporter } from './nodemailer.js';
import info from './nodemailer.js';
import axios from 'axios';
import joi from 'joi';
import dotenv from 'dotenv';
import { UsersController } from '../controller/users.controller.js';
import { UsersService } from '../service/users.service.js';
import { UsersRepository } from '../repositories/users.repository.js';

const usersRepository = new UsersRepository(prisma, joi, bcrypt);
const usersService = new UsersService(usersRepository);
const usersController = new UsersController(usersService);

//1. 회원가입 API
router.post('/signUp', authMiddleware, usersController.signUp);

//2. 로그인 인증 API
router.post('/signIn', authMiddleware, usersController.signIn);

//3. 카카오 로그인 인증 API
router.post('/kakao-signIn', authMiddleware, usersController.kakaoSignIn);

//4. 내정보 조회 API
router.get('/', authMiddleware, usersController.findMyInfo);
//5. 회원정보 삭제 API
router.delete('/', authMiddleware, usersController.deleteMyInfo);
//6. AccessToken 재발급 확인 API
router.post('/', authMiddleware, usersController.accessTokenList);
