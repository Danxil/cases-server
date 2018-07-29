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
  async createBot() {
    const result = await this.db.User.findOrCreate({
      defaults: { id: 777, balance: 1000000000 },
      where: { id: 777 },
    });
    return result[0];
  }
}
