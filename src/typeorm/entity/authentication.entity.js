import { EntitySchema } from 'typeorm';

export const Authentication = new EntitySchema({
  name: 'authentication', // Will use table name `category` as default behaviour.
  tableName: 'authentication', // Optional: Provide `tableName` property to override the default behaviour for table name.
  columns: {
    authId: {
      primary: true,
      type: 'int',
      generated: true,
    },
    userId: {
      type: 'varchar',
      unique: true,
    },
    generatedAuthNumber: {
      type: 'int',
      unique: true,
    },
  },
  relations: {
    users: {
      target: 'users',
      type: 'one-to-one',
      joinTable: true,
      //왜래키 설정(얘를 안쓰면 users + userId로 붙음 = usersuserId)
      joinColumn: { name: 'userId' },
      cascade: true,
    },
  },
});
