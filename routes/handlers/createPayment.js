import { createPayment } from '../../controllers/payments';
import { COINS_RATE } from '../../gameConfig';

export default () => async (req, res) => {
  const { amount } = req.body;
  const { balance, id: userId } = req.user;
  if (balance - amount < 0) {
    return res.status(400).send('Not enough balance');
  }
  const updatedUser = await req.user.update({ balance: balance - amount });
  const payment = await createPayment({
    amount: amount * COINS_RATE,
    userId,
  });
  global.ws.send(req.user.id, 'USER_UPDATED', updatedUser);
  return res.status(200).send({ ...payment.toJSON(), user: req.user });
};
