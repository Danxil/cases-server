export const getHistory = async ({ filter }) => {
  const history = await global.db.Payment.findAll({
    where: { ...filter },
    include: global.db.User,
  });
  return history;
};
export const createPayment = async ({ amount, userId }) => {
  const payment = await global.db.Payment.create({ amount, userId });
  return payment;
};
