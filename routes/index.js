import signUpHandler from './handlers/signUp';
import userHandler from './handlers/user';
import logoutHandler from './handlers/logout';
import statisticHandler from './handlers/statistic';

const authorization = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.send(401);
  }
  return next();
};

export default ({ app, userCtrl }) => {
  app.post('/sign-up', signUpHandler({ userCtrl }));
  app.get('/user', authorization, userHandler());
  app.get('/logout', authorization, logoutHandler());
  app.get('/statistic', authorization, statisticHandler());
};
