export const signUp = async ({ email, password }) => {
  const user = await global.db.User.findOne({ where: { email } });

  if (user) {
    throw new Error(`User with email ${email} is already exist`);
  }
  return global.db.User.create({ email, password });
};
