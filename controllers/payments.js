export default class PaymentsCtrl {
  constructor({ db, ws }) {
    this.db = db;
    this.ws = ws;
  }

  async getHistory({ filter }) {
    const history = await this.db.Payment.findAll({ where: { ...filter }, include: this.db.User });
    return history;
  }
  async createPayment({ amount, userId }) {
    const payment = await this.db.Payment.create({ amount, userId });
    return payment;
  }
}
