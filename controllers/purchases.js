export const getHistory = async ({ filter }) => {
  const history = await global.db.Purchase.findAll({
    where: { ...filter },
  });
  return history;
}
export const createPurchase = async ({ amount, userId }) => {
  const payment = await global.db.Purchases.create({ amount, userId });
  return payment;
}
