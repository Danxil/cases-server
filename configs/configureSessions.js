import { Pool } from 'pg';
import pgSs from 'connect-pg-simple';
import session from 'express-session';
import url from 'url';

export default () => {
  const params = url.parse(process.env.DATABASE_URL);
  const auth = params.auth.split(':');
  const config = {
    user: auth[0],
    password: auth[1],
    host: params.hostname,
    port: params.port,
    database: params.pathname.split('/')[1],
    ssl: process.env.NODE_ENV !== 'development',
  };
  const PgSs = pgSs(session);

  const sessionStore = new PgSs({
    pool: new Pool(config),
  });
  const domain = process.env.CLIENT_BASE_URL.split('//')[1];
  return session({
    secret: process.env.APP_SESSION_SECRET,
    store: sessionStore,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false, domain },
  });
};
