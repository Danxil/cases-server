import path from 'path';
import signUpHandler from './handlers/signUp';
import userHandler from './handlers/user';
import logoutHandler from './handlers/logout';
import statisticHandler from './handlers/statistic';
import withdrawsHandler from './handlers/getWithdraws';
import getPurchases from './handlers/getPurchases';
import createWithdrawHandler from './handlers/createWithdraw';
import createPurchaseHandler from './handlers/createPurchase';
import gameConfigHandler from './handlers/gameConfig';
import confirmWelcomeHandler from './handlers/confirmWelcome';
import getTablesHandler from './handlers/getTables';
import getAdminStatistic from './handlers/getAdminStatistic';

const authorization = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.send(401);
  }
  return next();
};

const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.send(403);
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
  app.get(`${process.env.API_PREFIX}/free-kassa/info`, createPurchaseHandler());
  app.get(`${process.env.API_PREFIX}/free-kassa/success`, createPurchaseHandler());
  app.get(`${process.env.API_PREFIX}/withdraws`, withdrawsHandler());
  app.post(`${process.env.API_PREFIX}/withdraws`, authorization, createWithdrawHandler());
  app.get(`${process.env.API_PREFIX}/game-config`, gameConfigHandler());
  app.get(`${process.env.API_PREFIX}/confirm-welcome`, confirmWelcomeHandler());
  app.get(`${process.env.API_PREFIX}/tables`, getTablesHandler());
  app.get(`${process.env.API_PREFIX}/admin-statistic`, authorization, isAdmin, getAdminStatistic());
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'client', 'index.html'));
  });
};
