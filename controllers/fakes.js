import _ from 'lodash';
import moment from 'moment';
import { MIN_PAYMENTS_TO_SHOW, GAME_MIN_ALIVE_GAMES_AMOUNT } from '../gameConfig';

let bots = [];
let payments = [];
const randomDate = (start, end) => {
  return new Date(
    start.valueOf() + (Math.random() * (end.valueOf() - start.valueOf())),
  );
};

export const generateBot = async () => {
  const result = await global.db.User.create({ bot: true });
  return result;
};

export const generateBots = async (amount) => {
  const result = await Promise.all(
    Array(amount).fill().map(() => generateBot()),
  );
  return result;
};
export const getRandomBot = () => _.sample(bots);
export const getBots = () => bots;
export const updateBots = async () => {
  await global.db.User.destroy({ where: { bot: true } });
  bots = await generateBots(Math.round(GAME_MIN_ALIVE_GAMES_AMOUNT / 2));
};

export const generatePayment = () => ({
  amount: _.random(0, 300),
  status: 'done',
  user: getRandomBot(),
  createdAt: randomDate(moment().add(-1, 'days'), moment()),
});
export const updatePayments = () => {
  payments = new Array(MIN_PAYMENTS_TO_SHOW).fill()
  .map(() => generatePayment());
};
export const getRandomPayment = () => _.sample(payments);
export const getPayments = () => payments;

export const updateFakes = async () => {
  await updateBots();
  updatePayments();
};
