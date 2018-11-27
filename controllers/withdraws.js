export const getHistory = async ({ filter }) => {
  const history = await global.db.Withdraw.findAll({
    where: { ...filter },
    include: global.db.User,
  });
  return history;
};
export const createWithdraw = async ({ amount, userId, method, requisite }) => {
  const withdraw = await global.db.Withdraw.create({ amount, userId, method, requisite });
  return withdraw;
};
