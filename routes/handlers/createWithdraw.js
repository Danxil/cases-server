import { createWithdraw } from '../../controllers/withdraws';
import { COINS_RATE } from '../../gameConfig';

export default () => async (req, res) => {
  const { amount, method, requisite } = req.body;
  const { balance, id: userId } = req.user;
  if (balance - amount < 0) {
    return res.status(400).send('Not enough balance');
  }
  const updatedUser = await req.user.update({ balance: balance - amount });
  const withdraw = await createWithdraw({
    amount: amount * COINS_RATE,
    userId,
    method,
    requisite,
  });
  global.ws.send(req.user.id, 'USER_UPDATED', updatedUser);
  return res.status(200).send({ ...withdraw.toJSON(), user: req.user });
};
