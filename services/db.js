import Sequelize from 'sequelize';
import models from '../models';

export default () => {
  const options = {
    sync: { force: process.env.NODE_ENV !== 'production' },
  };
  const dbConnection = process.env.DB_URL ? new Sequelize(process.env.DB_URL, options) :
  new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      ...options,
      host: process.env.DB_HOST,
      dialect: 'postgres',
      logging: false,
    },
  );

  const db = models(dbConnection);

  dbConnection.sync()
  .then(() => console.log('DB sync done'))
  .catch(() => console.log('DB sync failed'));
  return db;
};
