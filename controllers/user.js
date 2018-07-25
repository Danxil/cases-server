export default class UserCtrl {
  constructor({ db, ws }) {
    this.db = db;
    this.ws = ws;
  }

  async signUp({ email, password }) {
    const user = await this.db.User.findOne({ where: { email } });

    if (user) {
      throw new Error(`User with email ${email} is already exist`);
    }

    return this.db.User.create({ email, password });
  }

  async update({ id }, payload, { notify = true }) {
    const result = await this.db.User.update(payload, { returning: true, where: { id } });
    const user = result[1][0];
    if (notify) await this.ws.send(user.id, 'USER_UPDATED', user);
    return user;
  }
}
