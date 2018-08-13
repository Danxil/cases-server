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
        max: 5,
        min: 1,
        acquire: 20000,
        evict: 2000,
      },
    },
  );

  await dbConnection.query(
    'CREATE TABLE IF NOT EXISTS "session" (' +
      '"sid" varchar NOT NULL COLLATE "default",' +
      '"sess" json NOT NULL,' +
      '"expire" timestamp(6) NOT NULL' +
    ')' +
    'WITH (OIDS=FALSE);' +
    'ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_pkey";',
    'ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;',
  );

  const db = models(dbConnection);
  db.sequelize = dbConnection;
  await dbConnection.sync();
  console.log('DB sync succes');
  global.db = db;
  return db;
};
