export default class UserCtrl {
  constructor(db) {
    this.db = db;
  }
  async signIn({ login, password }) {
    const user = await this.db.User.findOne({ where: { login, password } });

    if (!user) {
      throw new Error('Login or password is wrong');
    }

    return user;
  }

  async signUp({ login, password }) {
    const user = await this.db.User.findOne({ where: { login } });

    if (user) {
      throw new Error(`User with login ${login} is already exist`);
    }

    return this.db.User.create({ login, password });
  }
}
