import { createPurchase } from '../../controllers/purchases';

export default () => async (req) => {
  const { AMOUNT: amount } = req.query;
  const user = await global.db.User.findOne({ where: { id: req.query.us_userId } })
  const { balance, id: userId } = user;
  const updatedUser = await user.update({ balance: balance + parseFloat(amount) });
  await createPurchase({
    amount,
    userId,
    status: 'done',
  });
  global.ws.send(user.id, 'USER_UPDATED', updatedUser);
};
