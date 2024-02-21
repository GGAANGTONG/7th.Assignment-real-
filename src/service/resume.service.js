export class ResumeService {
  constructor(resumeRepository) {
    this.resumeRepository = resumeRepository;
  }
  //1.이력서 목록 조회
  findResumeList = async (orderKey, orderValue) => {
    // ORM인 Prisma에서 Posts 모델의 create 메서드를 사용해 데이터를 요청합니다.

    const allResume = await this.resumeRepository.findResumeList(
      orderKey,
      orderValue
    );
    return allResume;
  };
  //2. 이력서 상세 조회
  findResume = async (userId, resumeId, email) => {
    // ORM인 Prisma에서 Posts 모델의 findMany 메서드를 사용해 데이터를 요청합니다.

    const resume = await this.resumeRepository.findResume(
      userId,
      resumeId,
      email
    );
    return resume;
  };
  //3. 이력서 생성
  createResume = async (userId, name, title, introduction) => {
    const createdResume = await this.resumeRepository.createResume(
      userId,
      name,
      title,
      introduction
    );

    return createdResume;
  };
  //4. 이력서 수정
  updateResume = async (
    userId,
    email,
    resumeId,
    title,
    introduction,
    status
  ) => {
    const updatedResume = await this.resumeRepository.updateResume(
      userId,
      email,
      resumeId,
      title,
      introduction,
      status
    );

    return updatedResume;
  };
  //5. 이력서 삭제
  deleteResume = async (userId, resumeId) => {
    const resume = await this.resumeRepository.deleteResume(userId, resumeId);

    return resume;
  };
}
