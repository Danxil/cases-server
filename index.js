import express from 'express';
import passport from 'passport';
import cors from 'cors';


import routes from './routes';
import socketEvents from './socket-events';
import configurePassport from './configs/configure-passport';
import configureSessions from './configs/configure-sessions';
import configureDb from './services/db';
import WS from './services/ws';

require('dotenv').config();

const app = express();
const db = configureDb();


app.use(cors({
  origin: [process.env.CLIENT_BASE_URL],
  credentials: true,
}));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));

const sessionParser = configureSessions();
app.use(sessionParser);
app.use(passport.initialize());
app.use(passport.session());

routes(app, db);
configurePassport({ db, app });


const server = app.listen(process.env.APP_REST_PORT);
socketEvents(new WS({ server, sessionParser, db }), db);
