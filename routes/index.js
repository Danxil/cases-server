import express from 'express';
import path from 'path';
import signUpHandler from './handlers/signUp';
import userHandler from './handlers/user';
import logoutHandler from './handlers/logout';
import statisticHandler from './handlers/statistic';
import paymentsHandler from './handlers/payments';
import createPaymentHandler from './handlers/createPayment';

const { API_PREFIX } = process.env;

const authorization = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.send(401);
  }
  return next();
};

export default ({ app, userCtrl, paymentsCtrl, ws }) => {
  app.post(`${process.env.API_PREFIX}/sign-up`, signUpHandler({ userCtrl }));
  app.get(`${process.env.API_PREFIX}/user`, authorization, userHandler());
  app.get(`${process.env.API_PREFIX}/logout`, authorization, logoutHandler());
  app.get(`${process.env.API_PREFIX}/statistic`, statisticHandler());
  app.get(`${process.env.API_PREFIX}/payments`, paymentsHandler({ paymentsCtrl }));
  app.post(`${process.env.API_PREFIX}/user/:userId/payments`, createPaymentHandler({ paymentsCtrl, ws }));
  app.get(/^(?!\/api\/).*$/, (req, res) => {
    console.log(1111);
    res.sendFile(path.join(__dirname, '../', 'client', 'index.html'));
  });
};
