import { EntitySchema } from 'typeorm';

export const Users = new EntitySchema({
  name: 'users', // Will use table name `category` as default behaviour.
  tableName: 'users', // Optional: Provide `tableName` property to override the default behaviour for table name.
  columns: {
    userId: {
      primary: true,
      type: 'int',
      generated: true,
    },

    email: {
      type: 'varchar',
    },
    password: {
      type: 'varchar',
    },
  },
});
