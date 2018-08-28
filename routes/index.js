import path from 'path';
import signUpHandler from './handlers/signUp';
import userHandler from './handlers/user';
import logoutHandler from './handlers/logout';
import statisticHandler from './handlers/statistic';
import paymentsHandler from './handlers/payments';
import getPurchases from './handlers/getPurchases';
import withdrawHandler from './handlers/createPayment';
import paymentHandler from './handlers/payment';

const authorization = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.send(401);
  }
  return next();
};

export default ({ app, userCtrl }) => {
  app.post(`${process.env.API_PREFIX}/sign-up`, signUpHandler({ userCtrl }));
  app.get(`${process.env.API_PREFIX}/user`, authorization, userHandler());
  app.get(`${process.env.API_PREFIX}/logout`, authorization, logoutHandler());
  app.get(`${process.env.API_PREFIX}/statistic`, statisticHandler());
  app.get(`${process.env.API_PREFIX}/payments`, paymentsHandler());
  app.get(`${process.env.API_PREFIX}/purchases`, getPurchases());
  app.post(`${process.env.API_PREFIX}/free-kassa/info`, paymentHandler());
  app.get(`${process.env.API_PREFIX}/free-kassa/success`, paymentHandler());
  app.get(`${process.env.API_PREFIX}/user/:userId/payments`, withdrawHandler());
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'client', 'index.html'));
  });
};
