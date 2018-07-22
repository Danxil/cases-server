import passport from 'passport';
import FacebookStrategy from 'passport-facebook';
import TwitterStrategy from 'passport-twitter';
import InstagramStrategy from 'passport-instagram';
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';
import { Strategy as VKontakteStrategy } from 'passport-vkontakte';
import LocalStrategy from 'passport-local';

const verify = ({ service, db }) => async (token, tokenSecret, profile, cb) => {
  try {
    const user = await db.User.findOrCreate({ where: { [`${service}Id`]: profile.id.toString() } });
    cb(null, user[0]);
  } catch (err) {
    cb(err);
  }
};

const getServiceAppConfigFields = ({ service }) => {
  switch (service) {
    case 'facebook':
    case 'instagram':
    case 'google':
    case 'vkontakte':
      return { appIdField: 'clientID', appSecretField: 'clientSecret' };
    case 'twitter':
      return { appIdField: 'consumerKey', appSecretField: 'consumerSecret' };
    default:
      return {};
  }
};

const getAuthOptions = ({ service }) => {
  const options = {};

  switch (service) {
    case 'google':
      options.scope = ['openid', 'email', 'profile'];
      break;
    default:
      break;
  }

  return options;
};

const configureStrategy = ({ app, db }) => ({ service, Strategy }) => {
  const { appIdField, appSecretField } = getServiceAppConfigFields({ service });
  const serviceUpperCase = service.toUpperCase();

  passport.use(
    new Strategy({
      [appIdField]: process.env[`APP_${serviceUpperCase}_APP_ID`],
      [appSecretField]: process.env[`APP_${serviceUpperCase}_APP_SECRET`],
      callbackURL: `/auth/${service}/callback`,
    },
    verify({ service: 'facebook', db }),
  ));

  app.get(
    `/auth/${service}`,
    passport.authenticate(service, getAuthOptions({ service })),
  );
  app.get(
    `/auth/${service}/callback`,
    passport.authenticate(
      service,
      {
        failureRedirect: `${process.env.CLIENT_BASE_URL}/login`,
        successRedirect: `${process.env.CLIENT_BASE_URL}/`,
      },
    ),
  );
};

const localStrategyVerify = ({ db }) => async (username, password, done) => {
  try {
    const user = await db.User.findOne({ where: { login: username } });
    if (!user) {
      console.log('Authentication failed. User not found');
      return done(null, false);
    }
    if (!user.verifyPassword(password)) {
      console.log('Authentication failed. Password is not correct');
      return done(null, false);
    }
    return done(null, user);
  } catch (error) {
    console.log('Authentication failed. Some error');
    return done(error);
  }
};

export default ({ db, app }) => {
  const configureStrategyFn = configureStrategy({ app, db });

  passport.use(new LocalStrategy(
    { usernameField: 'login', passwordField: 'password' },
    localStrategyVerify({ db }),
  ));
  app.post(
    '/auth/local',
    passport.authenticate('local'),
    (req, res) => {
      console.log('Authentication succes', req.body);
      res.sendStatus(200);
    },
  );

  configureStrategyFn({ service: 'facebook', Strategy: FacebookStrategy });
  configureStrategyFn({ service: 'twitter', Strategy: TwitterStrategy });
  configureStrategyFn({ service: 'instagram', Strategy: InstagramStrategy });
  configureStrategyFn({ service: 'google', Strategy: GoogleStrategy });
  configureStrategyFn({ service: 'vkontakte', Strategy: VKontakteStrategy });

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
};
