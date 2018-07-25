export default class UserCtrl {
  constructor({ db, ws }) {
    this.db = db;
    this.ws = ws;
  }

  async signUp({ login, password }) {
    const user = await this.db.User.findOne({ where: { login } });

    if (user) {
      throw new Error(`User with login ${login} is already exist`);
    }

    return this.db.User.create({ login, password });
  }

  async update({ id }, payload, { notify = true }) {
    const result = await this.db.User.update(payload, { returning: true, where: { id } });
    const user = result[1][0];
    if (notify) await this.ws.send(user.id, 'USER_UPDATED', user);
    return user;
  }
}
