export const getHistory = async ({ filter }) => {
  const history = await global.db.Purchase.findAll({
    where: { ...filter },
  });
  return history;
}
export const createPurchase = async ({ amount, userId, status }) => {
  const payment = await global.db.Purchase.create({ amount, userId, status });
  return payment;
}
