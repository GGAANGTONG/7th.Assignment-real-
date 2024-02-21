export class UsersController {
  constructor(usersService, joi) {
    this.usersService = usersService;
    this.joi = joi;
  }
  //1.회원가입
  signUp = async (req, res, next) => {
    // ORM인 Prisma에서 Posts 모델의 create 메서드를 사용해 데이터를 요청합니다.
    try {
      const { email, password, passwordCheck, name } = req.body;
      const signUp = await this.usersService.signUp(
        email,
        password,
        passwordCheck,
        name
      );
      return res.status(201).json({
        message: '계정이 성공적으로 생성되었습니다.',
        data: {
          signUp,
        },
      });
    } catch (error) {
      next(error);
    }
  };
  //2. 로그인 인증
  signIn = async (req, res, next) => {
    // ORM인 Prisma에서 Posts 모델의 findMany 메서드를 사용해 데이터를 요청합니다.
    try {
      const { email, password } = req.body;
      const signIn = await this.usersService.signUp(email, password);

      return res.status(200).json({ signIn });
    } catch (error) {
      next(error);
    }
  };
  //3. 카카오 인증
  kakaoSignIn = async (req, res, next) => {
    try {
      const header = req.headers['K-Authorization'];
      const kakaoToken = header.split(' ')[1];

      const result = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${kakaoToken}`,
        },
      });
      const { data } = result;
      const email = data.kakao_account.email;

      const kakaoSignIn = await this.usersService.kakaoSignIn(email);

      return res.status(200).json({ kakaoSignIn });
    } catch (error) {
      next(error);
    }
  };
  //4. 내정보 조회
  findMyInfo = async (req, res, next) => {
    try {
      const { userId } = req.locals.user;
      const findMyInfo = await this.usersService.findMyInfo(userId);

      return res.status(200).json({ findMyInfo });
    } catch (error) {
      next(error);
    }
  };
  //5. 회원정보 삭제
  deleteMyInfo = async (req, res, next) => {
    try {
      const { userId } = req.locals.user;
      const deleteMyInfo = await this.usersService.deleteMyInfo(userId);
      return res.status(200).json({ deleteMyInfo });
    } catch (error) {
      next(error);
    }
  };

  //6. AccessToken 재발급 확인
  accessTokenList = async (req, res, next) => {
    try {
      const { userId } = req.locals.user;
      const accessTokenList = await this.usersService.accessTokenList(userId);

      return res.status(200).json({ accessTokenList });
    } catch (error) {
      next(error);
    }
  };
}
