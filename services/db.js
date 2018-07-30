import Sequelize from 'sequelize';
import models from '../models';

export default () => {
  const dbConnection = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      sync: { force: process.env.NODE_ENV !== 'production' },
      host: process.env.DB_HOST,
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: true,
        connectionString: process.env.DATABASE_URL,
      },
    },
  );

  const db = models(dbConnection);

  dbConnection.sync()
  .then(() => console.log('DB sync done'))
  .catch(() => console.log('DB sync failed'));
  return db;
};
