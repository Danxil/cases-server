import { REQUIRED_PAID_TO_WITHDRAW } from '../../gameConfig';
import { createPayment } from '../../controllers/payments';

export default () => async (req, res) => {
  const { amount } = req.body;
  const { balance, id: userId, paid } = req.user;
  if (paid < REQUIRED_PAID_TO_WITHDRAW) {
    return res.status(400).send('Paid not enough');
  }
  if (balance - amount < 0) {
    return res.status(400).send('Not enough balance');
  }
  const updatedUser = await req.user.update({ balance: balance - amount });
  const payment = await createPayment({
    amount,
    userId,
  });
  global.ws.send(req.user.id, 'USER_UPDATED', updatedUser);
  return res.status(200).send({ ...payment.toJSON(), user: req.user });
};
