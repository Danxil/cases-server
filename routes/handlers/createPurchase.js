import { createPurchase } from '../../controllers/purchases';
import { REQUIRED_PAID_TO_WITHDRAW } from '../../gameConfig';

export default () => async (req) => {
  const { AMOUNT: amount, us_userId, intid } = req.query;
  const user = await global.db.User.findOne({ where: { id: us_userId } });
  const { balance, paid, id: userId } = user;

  const newPaid = paid + parseFloat(amount);

  const { updatedUser } = await global.db.sequelize
  .transaction(async (transaction) => {
    const updatedUserObj = await user.update({
      balance: user.isDemoMode() && newPaid >= REQUIRED_PAID_TO_WITHDRAW ?
        newPaid :
        balance + parseFloat(amount),
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
