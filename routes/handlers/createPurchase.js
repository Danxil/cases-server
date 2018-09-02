import { createPurchase } from '../../controllers/purchases';
import { REQUIRED_PAID_TO_WITHDRAW } from '../../gameConfig';

export default () => async (req) => {
  const { AMOUNT: amount, us_userId } = req.query;
  const user = await global.db.User.findOne({ where: { id: us_userId } });
  const { balance, paid, id: userId } = user;

  const newPaid = paid + parseFloat(amount);

  const updatedUser = await user.update({
    balance: paid < REQUIRED_PAID_TO_WITHDRAW && newPaid >= REQUIRED_PAID_TO_WITHDRAW ?
      newPaid :
      balance + parseFloat(amount),
    paid: newPaid,
  });
  await createPurchase({
    amount,
    userId,
    status: 'done',
  });
  global.ws.send(user.id, 'USER_UPDATED', updatedUser);
};
