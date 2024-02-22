import { EntitySchema } from 'typeorm';

export const AccessToken = new EntitySchema({
  name: 'accessToken', // Will use table name `category` as default behaviour.
  tableName: 'accesstoken', // Optional: Provide `tableName` property to override the default behaviour for table name.
  columns: {
    accessTokenId: {
      primary: true,
      type: 'int',
      generated: true,
    },
    userId: {
      type: 'int',
    },
    accessToken: {
      type: 'text',
    },
    reacquired: {
      type: 'boolean',
    },
    currentToken: {
      type: 'boolean',
    },
  },
  relations: {
    refreshtoken: {
      target: 'refreshtoken',
      type: 'many-to-one',
      joinTable: true,
      //왜래키 설정(얘를 안쓰면 users + userId로 붙음 = usersuserId)
      joinColumn: { name: 'userId' },
      cascade: true,
    },
  },
});
