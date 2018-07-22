export default class UserCtrl {
  constructor({ db }) {
    this.db = db;
  }

  async signUp({ login, password }) {
    const user = await this.db.User.findOne({ where: { login } });

    if (user) {
      throw new Error(`User with login ${login} is already exist`);
    }

    return this.db.User.create({ login, password });
  }
}
