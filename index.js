import express from 'express';
import WebSocket from 'ws';
import passport from 'passport';
import cors from 'cors';
import FacebookStrategy from 'passport-facebook';
import { Pool } from 'pg';
import pgSs from 'connect-pg-simple';
import session from 'express-session';
import getDb from './helpers/db';
import routes from './routes';
import socketEvents from './socket-events';
import WS from './helpers/ws';
import gameConfig from './game-config';

require('dotenv').config();

const db = getDb();
const PgSs = pgSs(session);
const app = express();

const wsServer = new WebSocket.Server({
  perMessageDeflate: false,
  port: process.env.APP_WS_PORT,
});

const ws = new WS(wsServer, db);

passport.use(new FacebookStrategy({
  clientID: gameConfig.FACEBOOK_APP_ID,
  clientSecret: gameConfig.FACEBOOK_APP_SECRET,
  callbackURL: '/auth/facebook/callback',
}, async (accessToken, refreshToken, profile, cb) => {
  try {
    const user = await db.User.findOrCreate({ where: { facebookId: profile.id } });
    cb(null, user[0]);
  } catch (err) {
    cb(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.User.findOne({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(cors({
  origin: process.env.CLIENT_BASE_URL,
  credentials: true,
}));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));

const sessionStore = new PgSs({
  pool: new Pool({
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }),
});

app.use(session({
  secret: process.env.APP_SESSION_SECRET,
  store: sessionStore,
}));
app.use(passport.initialize());
app.use(passport.session());

socketEvents(ws, db);
routes(app, db);

app.listen(process.env.APP_REST_PORT, () => {
  console.log('app listening on port 3000!');
});
