import passport from 'passport';
import UserCtrl from '../controllers/user';
import SignInHandler from '../handlers/sign-in';
import SignUpHandler from '../handlers/sign-up';


const authorization = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.send(401);
  }
  return next();
};

export default (app, db) => {
  const userCtrl = new UserCtrl(db);

  const signInHandler = new SignInHandler(db, userCtrl);
  const signUpHandler = new SignUpHandler(db, userCtrl);

  app.get('/', (req, res) => {
    res.send('Home');
  });

  app.post('/sign-in', signInHandler.run.bind(signInHandler));
  app.post('/sign-up', signUpHandler.run.bind(signUpHandler));
  app.get('/user', authorization, (req, res) => res.send(req.user.toJSON()));
  app.get('/logout', authorization, (req, res) => res.send(req.logout()));

  app.get('/auth/facebook', passport.authenticate('facebook'));

  app.get(
    '/auth/facebook/callback',
    passport.authenticate(
      'facebook',
      {
        failureRedirect: `${process.env.CLIENT_BASE_URL}/login`,
        successRedirect: `${process.env.CLIENT_BASE_URL}/`,
      },
    ),
  );
};
