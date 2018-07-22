import express from 'express';
import passport from 'passport';
import cors from 'cors';

require('dotenv').config();

/* eslint-disable import/first */
import routes from './routes';
import socketEvents from './socket-events';
import configurePassport from './configs/configurePassport';
import configureSessions from './configs/configureSessions';
import configureSchedules from './configs/configureSchedules';
import configureDb from './services/db';
import WS from './services/ws';
import GameCtrl from './controllers/game';
import UserCtrl from './controllers/user';
/* eslint-enable import/first */

const app = express();
const db = configureDb();


app.use(cors({
  origin: [process.env.CLIENT_BASE_URL],
  credentials: true,
}));
app.use(require('cookie-parser')());
app.use(require('body-parser').json({ extended: true }));

const sessionParser = configureSessions();
app.use(sessionParser);
app.use(passport.initialize());
app.use(passport.session());


configurePassport({ db, app });

const server = app.listen(process.env.APP_REST_PORT);

const gameCtrl = new GameCtrl({ db });
const ws = new WS({ server, sessionParser, db }).on('connection', gameCtrl.sendInitData);
gameCtrl.ws = ws;
const userCtrl = new UserCtrl({ db, ws });

configureSchedules({ gameCtrl });

routes({ app, db, userCtrl });
socketEvents({ ws, db, gameCtrl });
