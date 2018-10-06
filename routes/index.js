import path from 'path';
import signUpHandler from './handlers/signUp';
import userHandler from './handlers/user';
import logoutHandler from './handlers/logout';
import statisticHandler from './handlers/statistic';
import paymentsHandler from './handlers/payments';
import getPurchases from './handlers/getPurchases';
import createPaymentHandler from './handlers/createPayment';
import paymentHandler from './handlers/createPurchase';
import gameConfigHandler from './handlers/gameConfig';
import demoModeFinishedConfirmationHandler from './handlers/demoModeFinishedConfirmation';
import demoModeActivatedConfirmationHandler from './handlers/demoModeActivatedConfirmation';
import getTablesHandler from './handlers/getTables';

const authorization = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.send(401);
  }
  return next();
};

export default ({ app }) => {
  app.post(`${process.env.API_PREFIX}/sign-up`, signUpHandler());
  app.get(`${process.env.API_PREFIX}/user`, authorization, userHandler());
  // app.get(`${process.env.API_PREFIX}/users`, authorization, userHandler());
  app.get(`${process.env.API_PREFIX}/logout`, authorization, logoutHandler());
  app.get(`${process.env.API_PREFIX}/statistic`, statisticHandler());
  app.get(`${process.env.API_PREFIX}/purchases`, getPurchases());
  app.get(`${process.env.API_PREFIX}/free-kassa/info`, paymentHandler());
  app.get(`${process.env.API_PREFIX}/free-kassa/success`, paymentHandler());
  app.get(`${process.env.API_PREFIX}/payments`, paymentsHandler());
  app.post(`${process.env.API_PREFIX}/payments`, authorization, createPaymentHandler());
  app.get(`${process.env.API_PREFIX}/game-config`, gameConfigHandler());
  app.get(`${process.env.API_PREFIX}/demo-mode-finished-confirmation`, demoModeFinishedConfirmationHandler());
  app.get(`${process.env.API_PREFIX}/demo-mode-activated-confirmation`, demoModeActivatedConfirmationHandler());
  app.get(`${process.env.API_PREFIX}/tables`, getTablesHandler());
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'client', 'index.html'));
  });
};
