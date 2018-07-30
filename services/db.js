import Sequelize from 'sequelize';
import models from '../models';

export default () => {
  const dbConnection = new Sequelize(
    process.env.DATABASE_URL,
    {
      sync: { force: process.env.NODE_ENV !== 'production' },
      logging: false,
    },
  );

  const db = models(dbConnection);

  return dbConnection.sync().then(() => {
    console.log('DB sync done');
    return db;
  });
};
