export const getHistory = async ({ filter }) => {
  const history = await global.db.Purchase.findAll({
    where: { ...filter },
  });
  return history;
};
export const createPurchase = async ({ amount, userId, status, operationId, transaction }) => {
  const payment = await global.db.Purchase.create({
    amount,
    operationId,
    userId,
    status,
  }, { transaction });
  return payment;
};
