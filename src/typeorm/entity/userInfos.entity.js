import { EntitySchema } from 'typeorm';

export const UserInfos = new EntitySchema({
  name: 'userInfos', // Will use table name `category` as default behaviour.
  tableName: 'userinfos', // Optional: Provide `tableName` property to override the default behaviour for table name.
  columns: {
    userInfoId: {
      primary: true,
      type: 'int',
      generated: true,
    },
    userId: {
      type: 'int',
    },
    name: {
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
