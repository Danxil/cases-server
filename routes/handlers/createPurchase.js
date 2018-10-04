import { createPurchase } from '../../controllers/purchases';
import { COINS_RATE } from '../../gameConfig';

export default () => async (req) => {
  const { AMOUNT: amount, us_userId, intid = 'test' } = req.query;
  const user = await global.db.User.findOne({ where: { id: us_userId } });
  const { balance, paid, id: userId } = user;

  const newPaid = paid + parseFloat(amount);

  const { updatedUser } = await global.db.sequelize
  .transaction(async (transaction) => {
    const updatedUserObj = await user.update({
      balance: balance + parseFloat(amount / COINS_RATE),
      paid: newPaid,
    }, { transaction });
    await createPurchase({
      amount,
      userId,
      operationId: intid.toString(),
      status: 'done',
      transaction,
    });
    return { updatedUser: updatedUserObj };
  });
  global.ws.send(user.id, 'USER_UPDATED', updatedUser);
};
