export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }
  //1.회원가입
  signUp = async (email, password, passwordCheck, name) => {
    // ORM인 Prisma에서 Posts 모델의 create 메서드를 사용해 데이터를 요청합니다.

    const signUp = await this.usersRepository.signUp(
      email,
      password,
      passwordCheck,
      name
    );

    return signUp;
  };
  //2. 로그인 인증
  signIn = async (email, password, ip, useragent) => {
    // ORM인 Prisma에서 Posts 모델의 findMany 메서드를 사용해 데이터를 요청합니다.
    const signIn = await this.usersRepository.signIn(
      email,
      password,
      ip,
      useragent
    );

    return signIn;
  };
  //3. 카카오 인증
  kakaoSignIn = async (email) => {
    const kakaoSignIn = await this.usersRepository.kakaoSignIn(email);
    return kakaoSignIn;
  };
  //4. 회원정보 조회
  findMyInfo = async (userId) => {
    const findMyInfo = await this.usersRepository.findMyInfo(userId);
    return findMyInfo;
  };

  //5. 회원정보 삭제
  deleteMyInfo = async (userId) => {
    const deleteMyInfo = await this.usersRepository.deleteMyInfo(userId);
    return deleteMyInfo;
  };

  //6. AccessToken 재발급 확인
  accessTokenList = async (userId) => {
    const accessTokenList = await this.usersRepository.accessTokenList(userId);

    return accessTokenList;
  };
}
