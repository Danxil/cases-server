import { START_USER_BALANCE } from '../../gameConfig';

export default ({ paymentsCtrl, ws }) => async (req, res) => {
  const { amount } = req.body;
  const { balance, id: userId } = req.user;
  if (balance - amount < START_USER_BALANCE) {
    return res.status(400).send('Not enough balance');
  }
  const updatedUser = await req.user.update({ balance: balance - amount });
  const payment = await paymentsCtrl.createPayment({
    amount,
    userId,
  });
  ws.send(req.user.id, 'USER_UPDATED', updatedUser);
  return res.status(200).send({ ...payment.toJSON(), user: req.user });
};
