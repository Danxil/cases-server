import { createPurchase } from '../../controllers/purchases';

export default () => async (req) => {
  console.log(3, req.query);
  const { amount } = req.body;
  const { balance, id: userId } = req.user;
  const updatedUser = await req.user.update({ balance: balance + req.query.AMOUNT });
  await createPurchase({
    amount,
    userId,
    status: 'done',
  });
  global.ws.send(req.user.id, 'USER_UPDATED', updatedUser);
};
