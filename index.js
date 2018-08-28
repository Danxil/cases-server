import express from 'express';
import expressSslify from 'express-sslify';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import PaymentsCtrl from './controllers/payments';
import routes from './routes';
import socketEvents from './socketEvents';
import configurePassport from './configs/configurePassport';
import configureSessions from './configs/configureSessions';
import configureSchedules from './configs/configureSchedules';
import configureDb from './services/db';
import WS from './services/ws';
import GameCtrl from './controllers/game';
import UserCtrl from './controllers/user';
import initData from './socketEvents/handlers/initData';
import { updateFakes } from './controllers/fakes';

require('dotenv').config();

const app = express();
if (process.env.NODE_ENV === 'production') app.use(expressSslify.HTTPS({ trustProtoHeader: true }));

configureDb().then(async (db) => {
  app.use(cors({
    origin: process.env.CLIENT_BASE_URL.split(','),
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(bodyParser.json({ extended: true }));

  const sessionParser = await configureSessions({ app });
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(path.join(__dirname, 'client'), { index: false, extensions: false, redirect: false }));
  configurePassport({ db, app });

  const server = app.listen(process.env.PORT, () => console.log('REST started'));
  const userCtrl = new UserCtrl({ db });
  const gameCtrl = new GameCtrl({ db, userCtrl });

  const ws = new WS({ server, sessionParser, db }).on(
    'connection',
    ({ user, ws: wsService }) => initData({ user, ws: wsService, gameCtrl }),
  );

  await updateFakes();
  await configureSchedules({ gameCtrl, userCtrl, ws, db });

  routes({ app, userCtrl });
  socketEvents({ ws, db, gameCtrl, userCtrl });
  return null;
}).catch((e) => {
  console.log('App start failed!', e);
});


process.on('SIGTERM', () => {
  console.log('SIGTERM');
  global.db.sequelize.close()
  .then(() => {
    console.log('SIGTERM done');
    return process.exit(0);
  })
  .catch((err) => {
    console.log('SIGTERM failed', err);
  });
});

