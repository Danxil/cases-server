import passport from 'passport';
import FacebookStrategy from 'passport-facebook';
import TwitterStrategy from 'passport-twitter';
import InstagramStrategy from 'passport-instagram';
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';
import { Strategy as VKontakteStrategy } from 'passport-vkontakte';
import LocalStrategy from 'passport-local';

const getEmailField = ({ service, profile, params }) => {
  switch (service) {
    case 'vkontakte':
      return params.email;
    case 'facebook':
      return profile._json.email;
    case 'google':
      return profile.emails[0] ? profile.emails[0].value : null;
    default:
      return null;
  }
};

const getPhotoField = ({ service, profile }) => {
  switch (service) {
    case 'vkontakte':
      return profile._json.photo;
    case 'instagram':
      return profile._json.data.profile_picture;
    case 'facebook':
    case 'google':
    case 'twitter':
      return profile.photos[0] ? profile.photos[0].value : null;
    default:
      return null;
  }
};

const getProfileFields = ({ service }) => {
  switch (service) {
    case 'vkontakte':
      return ['email'];
    case 'facebook':
      return ['id', 'emails', 'displayName', 'picture'];
    default:
      return [];
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
    case 'facebook':
      options.scope = ['email'];
      break;
    case 'vkontakte':
      options.scope = ['email'];
      break;
    default:
      break;
  }
  return options;
};

const verify = ({ service, db }) => async (
  token,
  tokenSecret,
  params,
  profile,
  cb,
) => {
  try {
    const result = await db.User.findOrCreate({
      defaults: {
        displayName: profile.displayName,
        email: getEmailField({ service, profile, params }),
        photo: getPhotoField({ service, profile }),
      },
      where: { [`${service}Id`]: profile.id.toString() },
    });
    const user = result[0];
    cb(null, user);
  } catch (err) {
    cb(err);
  }
};

const configureStrategy = ({ app, db }) => ({ service, Strategy }) => {
  const { appIdField, appSecretField } = getServiceAppConfigFields({ service });
  const serviceUpperCase = service.toUpperCase();

  passport.use(
    new Strategy({
      [appIdField]: process.env[`APP_${serviceUpperCase}_APP_ID`],
      [appSecretField]: process.env[`APP_${serviceUpperCase}_APP_SECRET`],
      callbackURL: `${process.env.API_PREFIX}/auth/${service}/callback`,
      profileFields: getProfileFields({ service }),
    },
    verify({ service, db }),
  ));
  app.get(
    `${process.env.API_PREFIX}/auth/${service}`,
    (req, res) => {
      console.log(222);
      passport.authenticate(service, getAuthOptions({ service }))(req, res);
    },
  );
  app.get(
    `${process.env.API_PREFIX}/auth/${service}/callback`,
    (req, res) => {
      passport.authenticate(
        service,
        {
          failureRedirect: `${process.env.CLIENT_BASE_URL}/login`,
          successRedirect: `${process.env.CLIENT_BASE_URL}/`,
        },
      )(req, res);
    },
  );
};

const localStrategyVerify = ({ db }) => async (username, password, done) => {
  try {
    const user = await db.User.findOne({ where: { email: username } });
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
    { usernameField: 'email', passwordField: 'password' },
    localStrategyVerify({ db }),
  ));
  app.post(
    `${process.env.API_PREFIX}/auth/local`,
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
