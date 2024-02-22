import { EntitySchema } from 'typeorm';

export const RefreshToken = new EntitySchema({
  name: 'refreshToken', // Will use table name `category` as default behaviour.
  tableName: 'refreshtoken', // Optional: Provide `tableName` property to override the default behaviour for table name.
  columns: {
    userId: {
      primary: true,
      type: 'int',
      generated: true,
    },
    refreshToken: {
      type: 'text',
    },
    ip: {
      type: 'varchar',
    },
    useragent: {
      type: 'varchar',
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
