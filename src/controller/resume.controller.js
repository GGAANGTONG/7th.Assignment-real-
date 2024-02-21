export class ResumeController {
  constructor(resumeService) {
    this.resumeService = resumeService;
  }
  //1.이력서 목록 조회
  findResumeList = async (req, res, next) => {
    // ORM인 Prisma에서 Posts 모델의 create 메서드를 사용해 데이터를 요청합니다.

    try {
      const { orderKey, orderValue } = req.query;
      const allResume = await this.resumeService.findResumeList(
        orderKey,
        orderValue
      );
      return res.status(200).json({ data: allResume });
    } catch (error) {
      next(error);
    }
  };
  //2. 이력서 상세 조회
  findResume = async (req, res, next) => {
    // ORM인 Prisma에서 Posts 모델의 findMany 메서드를 사용해 데이터를 요청합니다.
    try {
      const { userId, email } = req.locals.user;
      const { resumeId } = req.params;
      const resume = await this.resumeService.findResume(
        userId,
        resumeId,
        email
      );
      return res.status(200).json({ data: resume });
    } catch (error) {
      next(error);
    }
  };
  //3. 이력서 생성
  createResume = async (req, res, next) => {
    try {
      const { userId } = req.locals.user;
      const { name } = req.locals.userInfo;
      const { title, introduction } = req.body;
      const createdResume = await this.resumeService.createResume(
        userId,
        name,
        title,
        introduction
      );

      return res.status(201).json({ data: createdResume });
    } catch (error) {
      next(error);
    }
  };
  //4. 이력서 수정
  updateResume = async (req, res, next) => {
    try {
      const { userId, email } = req.locals.user;
      const { resumeId } = req.params;
      const { title, introduction, status } = req.body;
      const updatedResume = await this.resumeService.updateResume(
        userId,
        email,
        resumeId,
        title,
        introduction,
        status
      );

      return res.status(201).json({ data: updatedResume });
    } catch (error) {
      next(error);
    }
  };
  //5. 이력서 삭제
  deleteResume = async (req, res, next) => {
    try {
      const { userId } = req.locals.user;
      const { resumeId } = req.params;
      const resume = await this.resumeService.deleteResume(userId, resumeId);

      return res.status(200).json({ resume });
    } catch (error) {
      next(error);
    }
  };
}
