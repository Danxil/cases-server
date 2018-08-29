import { createPurchase } from '../../controllers/purchases';

export default () => async (req) => {
  console.log(3, req.query);
  const { amount } = req.body;
  const user = await global.db.User.findOne({ where: { id: req.query.us_userId } })
  const { balance, id: userId } = user;
  const updatedUser = await req.user.update({ balance: balance + parseFloat(req.query.AMOUNT) });
  await createPurchase({
    amount,
    userId,
    status: 'done',
  });
  global.ws.send(req.user.id, 'USER_UPDATED', updatedUser);
};
