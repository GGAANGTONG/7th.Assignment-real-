import { EntitySchema } from 'typeorm';

const resumeStatus = {
  APPLY: 'APPLY',
  DROP: 'DROP',
  PASS: 'PASS',
  INTERVIEW1: 'INTERVIEW1',
  INTERVIEW2: 'INTERVIEW2',
  FINAL_PASS: 'FINAL_PASS',
};

export const Resume = new EntitySchema({
  name: 'resume', // Will use table name `category` as default behaviour.
  tableName: 'resume', // Optional: Provide `tableName` property to override the default behaviour for table name.
  columns: {
    resumeId: {
      primary: true,
      type: 'int',
      generated: true,
    },
    userId: {
      type: 'Int',
    },
    title: {
      type: 'varchar',
    },
    introduction: {
      type: 'varchar',
    },
    author: {
      type: 'varchar',
    },
    status: {
      type: 'enum',
      enum: resumeStatus,
      default: resumeStatus.APPLY,
    },
    createdAt: {
      type: 'datetime',
    },
  },
  relations: {
    users: {
      target: 'users',
      type: 'many-to-one',
      joinTable: true,
      //왜래키 설정(얘를 안쓰면 users + userId로 붙음 = usersuserId)
      joinColumn: { name: 'userId' },
      cascade: true,
    },
  },
});
