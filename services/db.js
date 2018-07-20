import Sequelize from 'sequelize';
import models from '../models';

export default () => {
  const dbConnection = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      logging: false,
      sync: { force: true },
    },
  );

  const db = models(dbConnection);

  dbConnection.sync().then(() => {
    console.log('db sync success');
  });
  return db;
};
