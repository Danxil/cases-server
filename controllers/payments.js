export default class PaymentsCtrl {
  constructor({ db, ws }) {
    this.db = db;
    this.ws = ws;
  }

  async getHistory() {
    const history = await this.db.Payment.findAll({ include: this.db.User });
    return history;
  }
}
