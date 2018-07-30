import { Pool } from 'pg';
import pgSs from 'connect-pg-simple';
import session from 'express-session';

export default () => {
  const PgSs = pgSs(session);

  const sessionStore = new PgSs({
    pool: new Pool({
      // host: process.env.DB_HOST,
      // database: process.env.DB_NAME,
      // user: process.env.DB_USER,
      // password: process.env.DB_PASSWORD,
      // ssl: true,
    }),
  });

  return session({
    secret: process.env.APP_SESSION_SECRET,
    store: sessionStore,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  });
};
