// const router = require('../src/routes/users.router.js');
import router from '../src/routes/users.router.js'; // ctrl + 클릭해서 가지면 정상적으로 된거
import jest from 'jest';
//import 해온 users.router.js가 es6모듈이라서 공존할 수 없는 두 버전의 모듈이 혼용돼서 생긴 에러
//jest config.js를 세팅해야 함
//babeling을 해야 함(자동 버전 최적화 어플? 모듈?)
//*최신 jest 버전은 특정한 세팅을 하면 es6 모듈도 지원함(package.json 참조)
async function emailTest() {
  const req = {}; // 가짜 요청 객체 생성
  const res = {
    //jest 내부 코드 문제(클릭했을 때 안따라가지면 그 메서드는 없는거임, 객체가 갖고 있지 않은 프로퍼티)
    status: jest.fn(),
    json: jest.fn(),
    render: jest.fn(),
  };
  //res라는 오브젝트를 jest가 express 대신 본떠서 만들었음(chat gpt에서)
  //호출해야 하니까
  //express에서 테스트 코드를 작성하는 방법이 따로 있음.(jest express test code)
  //test는 무조건 다 쪼개야 함 세밀하게
  //입력값 검증, 이메일 인증(테스트코드는 api를 통째로 하지 않음 unit test)
  //현업에선 비즈니스 로직보다 테스트 코드 짜는 시간이 더 길 수 있음(이게 맞음)
  //테스트 과정에서 사람이 끼면, 테스트 코드라 할 수 없음

  //이메일은 외부 라이브러리 의존성이 있음. smtp 프로토콜 통신 이용 중
  //외부 네트워크 호출테스트가 가장 위험함(테스트코드는 그 자체만으로 작동해야만 함, 외부 의존성 0이어야 함)
  //실제로 메일을 보내선 안됨(그래서 mocking을 씀)
  req.body = { email: 'qkrds0914@gmail.com', password: 'password' };

  await router.post('/signIn', async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.users.findFirst({
        where: {
          email,
        },
      });

      if (!user)
        return res
          .status(404)
          .json({ error: '로그인 정보를 다시 확인해 주세요' });

      if (!(await bcrypt.compare(password, user.password)))
        return res
          .status(400)
          .json({ message: '비밀번호가 일치하지 않습니다.' });

      //nodemailer을 통한 로그인 인증

      transporter;

      const generatedAuthNumber = Math.floor(Math.random() * 10000 + 1);
      const validationMail = info(email, generatedAuthNumber);
      const validatedAuthNumber = Math.floor(Math.random() * 10000 + 1);
      //난수가 잘갔나? >> (난수가 잘갔고, 서버가 클라로부터 난수를 받았다 가정 << 이건 서버가 어찔 할 수 있는게 없음, 서버의 비즈니스 로직 차원에서 할 방법이 없단거임, 즉, 실제 이메일 보낼 필요가 없음) >>
      //클라이언트 요청 이벤트에 대한 서버 처리
      //외부 라이브러리는 빈번하게 교체될 거란 가정을 해야댐, 외부 라이브러리를 기존 전제에 깔고 테스트 코드를 짜버리면, 외부라이브러리 바꾸는 순간 전부 다 대공사 해야댐
      //발행한 난수가 맞는지 검증하기 위해서 이걸 미리 저장을 해 둬야 하나?
      // 처음 sum.test.js 수준으로 쪼개봐야 함
      // 메일 보내는 정책이 엄청 스트릭트함, 그래서 메일서버에서 스펨으로 바꿔서 막아버릴 거임(어떻게 인가를 받을 수 있을가 고민)
      res.render('validation.ejs');

      expect(
        res.render('validation.ejs').toHaveBeenCalledWith('validation.ejs')
      );
      //추가 비밀번호 인증을 위해(req-res를 한번 더 해야해서) validation.ejs로 리다이렉트
    } catch (error) {
      next(error);
    }
  });
}

it('validationTest', async () => await emailTest());
