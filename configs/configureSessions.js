import session from 'express-session';

const SequelizeStore = require('connect-session-sequelize')(session.Store);

export default async ({ app }) => {
  const store = new SequelizeStore({
    db: global.db.sequelize,
  });
  const sessionParser = session({
    secret: process.env.APP_SESSION_SECRET,
    store,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  });
  app.use(sessionParser);
  await store.sync();
  return sessionParser;
};
