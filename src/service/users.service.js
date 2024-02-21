export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }
  //1.회원가입
  signUp = async (email, password, passwordCheck, name) => {
    // ORM인 Prisma에서 Posts 모델의 create 메서드를 사용해 데이터를 요청합니다.

    try {
      const signUp = await this.usersRepository.signUp(
        email,
        password,
        passwordCheck,
        name
      );

      return signUp;
    } catch (error) {
      next(error);
    }
  };
  //2. 로그인 인증
  signIn = async (email, password) => {
    // ORM인 Prisma에서 Posts 모델의 findMany 메서드를 사용해 데이터를 요청합니다.
    try {
      const signIn = await this.usersRepository.signIn(email, password);

      return signIn;
    } catch (error) {
      next(error);
    }
  };
  //3. 카카오 인증
  kakaoSignIn = async (email) => {
    try {
      const kakaoSignIn = await this.usersRepository.kakaoSignIn(email);
      return kakaoSignIn;
    } catch (error) {
      next(error);
    }
  };
  //4. 회원정보 조회
  findMyInfo = async (userId) => {
    try {
      const findMyInfo = await this.usersRepository.findMyInfo(userId);
      return findMyInfo;
    } catch (error) {
      next(error);
    }
  };

  //5. 회원정보 삭제
  deleteMyInfo = async (userId) => {
    try {
      const deleteMyInfo = await this.usersRepository.deleteMyInfo(userId);
      return deleteMyInfo;
    } catch (error) {
      next(error);
    }
  };

  //6. AccessToken 재발급 확인
  accessTokenList = async (userId) => {
    try {
      const accessTokenList =
        await this.usersRepository.accessTokenList(userId);

      return accessTokenList;
    } catch (error) {
      next(error);
    }
  };
}
