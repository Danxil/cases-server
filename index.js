import dotenv from 'dotenv';

dotenv.config()

/* eslint-disable import/first */
import express from 'express';
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
/* eslint-enable import/first */

const app = express();
configureDb().then(async (db) => {
  app.use(cors({
    origin: [process.env.CLIENT_BASE_URL],
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(bodyParser.json({ extended: true }));

  const sessionParser = configureSessions();
  app.use(sessionParser);
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(path.join(__dirname, 'client'), { index: false, extensions: false, redirect: false }));
  configurePassport({ db, app });

  const server = app.listen(process.env.PORT, () => console.log('REST started'));

  const userCtrl = new UserCtrl({ db });
  const gameCtrl = new GameCtrl({ db, userCtrl });
  const paymentsCtrl = new PaymentsCtrl({ db });

  const ws = new WS({ server, sessionParser, db }).on(
    'connection',
    ({ user, ws: wsService }) => initData({ user, ws: wsService, gameCtrl }),
  );

  await configureSchedules({ gameCtrl, userCtrl, ws, db });

  routes({ app, ws, db, userCtrl, paymentsCtrl });
  socketEvents({ ws, db, gameCtrl, userCtrl });
  return null;
}).catch((e) => {
  console.log('App start failed!', e);
});
