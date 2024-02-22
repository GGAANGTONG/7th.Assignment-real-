import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { AccessToken } from './entity/accessToken.entity.js';
import { Authentication } from './entity/authentication.entity.js';
import { RefreshToken } from './entity/refreshToken.entity.js';
import { Resume } from './entity/resume.entity.js';
import { UserInfos } from './entity/userInfos.entity.js';
import { Users } from './entity/users.entity.js';

//username에는 시스템 환경변수가 할당돼있었네(3050ti)
dotenv.config();
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.HOST,
  port: process.env.ORM_PORT,
  username: process.env.ORM_USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  //database 동기화 명령(npx prisma db push랑 같음, 매우 위험)
  synchronize: false,
  entities: [
    AccessToken,
    Authentication,
    RefreshToken,
    Resume,
    UserInfos,
    Users,
  ],
});

export { dataSource };
