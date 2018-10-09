import Sequelize from 'sequelize';
import models from '../models';

require('dotenv').config();
const debug = require('debug')('sequelize');

export default async () => {
  const dbConnection = new Sequelize(
    process.env.DATABASE_URL,
    {
      sync: { force: process.env.NODE_ENV !== 'production' },
      // sync: { force: false },
      logging: str => debug(str),
      pool: {
        max: 1,
        min: 1,
        acquire: 20000,
        evict: 2000,
      },
    },
  );

  const db = models(dbConnection);
  db.sequelize = dbConnection;
  await dbConnection.sync();

  const initDataPromises = Object.keys(db).map((modelName) => {
    return 'initData' in db[modelName] ? db[modelName].initData(db) : null;
  });
  await Promise.all(initDataPromises);

  console.log('DB sync succes');
  global.db = db;
  return db;
};
