import { dataSource } from '../typeorm/index.js';

export class UsersRepository {
  constructor(joi, bcrypt, transporter, info, jwt) {
    this.joi = joi;
    this.bcrypt = bcrypt;
    this.transporter = transporter;
    this.info = info;
    this.jwt = jwt;
  }
  //1.회원가입
  signUp = async (email, password, passwordCheck, name) => {
    // ORM인 Prisma에서 Posts 모델의 create 메서드를 사용해 데이터를 요청합니다.
    const validationTest = this.joi.object({
      email: this.joi.string().email(),
    });
    const validation = await validationTest.validateAsync({ email });
    if (!validation) return { error: '이메일 형식이 맞는지 확인해 주세요.' };

    const isExistUser = await dataSource.getRepository('users').findOne({
      where: { email },
    });

    if (isExistUser) return { error: '이미 존재하는 회원정보입니다.' };

    if (password.length < 6)
      return { error: '비밀번호는 최소 6자 이상이어야 합니다.' };

    if (password !== passwordCheck)
      return {
        error: '비밀번호와 비밀번호 확인이 일치하는지 확인해 주세요.',
      };

    //bcrypt를 통한 암호화
    const hashedPassword = await this.bcrypt.hash(password, 15);
    const data = {
      email,
      password: hashedPassword,
    };
    const user = await dataSource.getRepository('users').insert(data);
    await dataSource.getRepository('users').insert(data);

    return {
      message: '계정이 성공적으로 생성되었습니다.',
      data: {
        email: user.email,
        name: user.name,
      },
    };
  };
  //2. 로그인 인증
  signIn = async (email, password, ip, useragent) => {
    // ORM인 Prisma에서 Posts 모델의 findMany 메서드를 사용해 데이터를 요청합니다.

    const user = await dataSource.getRepository('users').findOne({
      where: {
        email,
      },
    });

    if (!user) return { error: '로그인 정보를 다시 확인해 주세요' };

    if (!(await this.bcrypt.compare(password, user.password)))
      return { message: '비밀번호가 일치하지 않습니다.' };

    //nodemailer을 통한 로그인 인증

    this.transporter;

    const generatedAuthNumber = Math.floor(Math.random() * 10000 + 1);

    //인증 정보 db보관 전 기존 이메일 2차 인증 정보가 db안에 있을 경우 삭제
    const pastAuthData = dataSource.getRepository('users').findOne({
      where: {
        userId: user.userId,
      },
    });
    if (pastAuthData) {
      await dataSource.getRepository('authentication').delete({
        userId: user.userId,
      });
    }
    //인증 성공하기 전까지 인증 정보 db보관
    const data = {
      userId: user.userId,
      generatedAuthNumber,
    };
    await dataSource.getRepository('authentication').insert(data);

    const authNumberDB = await dataSource
      .getRepository('authentication')
      .findOne({
        where: {
          userId: user.userId,
          generatedAuthNumber,
        },
      });
    //로그인 시도자가 입력하여 넘어온 난수 입력값을 확인하는 로직
    //AuthNumberFromEmail은 프론트엔드에서(클라이언트로부터) 넘어와야 하는 값
    const validationMail = this.info(email, generatedAuthNumber);
    const AuthNumberFromEmail = generatedAuthNumber;

    //이메일 인증
    if (authNumberDB.generatedAuthNumber !== AuthNumberFromEmail) {
      return { error: '인증번호가 일치하지 않습니다.' };
    } else if (authNumberDB === AuthNumberFromEmail) {
      //지금 생각해 보니, 인증을 안하고 재 로그인을 시도하는 사람을 구별해내기 위해서는 userId도 같이 받아야 할 거 같다.
      await dataSource.getRepository('authentication').delete({
        userId: user.userId,
        generatedAuthNumber,
      });
    }
    const accessToken = this.jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        password: user.password,
      },
      process.env.ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: '12h' }
    );
    const refreshToken = this.jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        password: user.password,
      },
      process.env.REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: '7d' }
    );
    const DBrefreshToken = await dataSource
      .getRepository('refreshToken')
      .findOne({
        where: {
          userId: user.userId,
        },
      });
    if (DBrefreshToken) {
      await dataSource.getRepository('refreshToken').delete({
        userId: user.userId,
      });
    }
    const DBaccessToken = await dataSource
      .getRepository('accessToken')
      .findOne({
        where: {
          userId: user.userId,
        },
      });

    if (DBaccessToken) {
      await dataSource.getRepository('accessToken').delete({
        userId: user.userId,
      });
    }
    const data1 = {
      userId: user.userId,
      refreshToken,
      ip,
      useragent,
    };
    await dataSource.getRepository('refreshToken').insert(data1);
    const data2 = {
      userId: user.userId,
      //데이터베이스 숙련도 이슈로 인해 빼기로 함. 어차피 userId로 서로 연관돼 있기 때문에 큰 문제 없을 듯
      // refreshToken,
      accessToken,
      reacquired: false,
      currentToken: true,
    };

    await dataSource.getRepository('accessToken').insert(data2);

    return {
      message: '로그인에 성공하였습니다.',
      accessToken,
      refreshToken,
    };
  };

  //3. 카카오 인증
  kakaoSignIn = async (email) => {
    const user = await dataSource.getRepository('users').findFirst({
      where: {
        email,
      },
    });

    if (!user) return { error: '해당하는 사용자가 존재하지 않습니다.' };

    const accessToken = this.jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        password: user.password,
      },
      process.env.ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: '12h' }
    );
    const refreshToken = this.jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        password: user.password,
      },
      process.env.REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: '7d' }
    );

    const DBrefreshToken = await dataSource
      .getRepository('refreshToken')
      .findOne({
        where: {
          userId: user.userId,
        },
      });
    if (DBrefreshToken) {
      await dataSource.getRepository('refreshToken').delete({
        userId: user.userId,
      });
    }

    const data3 = {
      userId: user.userId,
      refreshToken,
      ip: req.ip,
      useragent: req.headers['user-agent'],
    };
    await dataSource.getRepository('refreshToken').insert(data3);
    const data4 = {
      userId: user.userId,
      refreshToken,
      accessToken,
      reacquired: false,
      currentToken: true,
    };
    await dataSource.getRepository('accessToken').insert(data4);

    return {
      message: '로그인에 성공하였습니다.',
      accessToken,
      refreshToken,
    };
  };
  //4. 회원정보 조회
  findMyInfo = async (userId) => {
    const user = await dataSource.getRepository('users').findOne({
      where: {
        userId: +userId,
      },
      select: {
        userId: true,
        email: true,
        userInfo: {
          select: {
            name: true,
          },
        },
      },
    });
    return {
      message: '회원님의 정보입니다.',
      data: user,
    };
  };

  //5. 회원정보 삭제
  deleteMyInfo = async (userId) => {
    await dataSource.getRepository('users').delete({
      userId: +userId,
    });

    return { message: '회원정보가 성공적으로 삭제되었습니다.' };
  };

  //6. AccessToken 재발급 확인
  accessTokenList = async (userId) => {
    const accessTokenList = await dataSource.getRepository('accessToken').find({
      where: {
        userId: +userId,
      },
      select: {
        userId: true,
        accessTokenId: true,
        reacquired: true,
        currentToken: true,
      },
    });
    if (!accessTokenList) {
      return {
        error: '잘못된 접근입니다.',
      };
    }
    return {
      message: '회원님의 현재 accessToken 재발급 목록입니다(로그인 시 초기화).',
      data: accessTokenList,
    };
  };
}
