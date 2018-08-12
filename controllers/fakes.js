import _ from 'lodash';
import moment from 'moment';
import { GAME_MIN_ALIVE_GAMES_AMOUNT, MIN_PAYMENTS_TO_SHOW } from '../gameConfig';

let statisticBots = [];
let playgroundBots = [];
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

export const generateStatisticBots = async (amount) => {
  const result = await Promise.all(
    Array(amount).fill().map(() => generateBot()),
  );
  return result;
}
export const getRandomStatisticBot = () => _.sample(statisticBots);
export const getStatisticBots = () => statisticBots.filter(o => o.balance >= 10).sort((a, b) => {
  return a.balance > b.balance ? -1 : 1;
});

export const updatePlaygroundBots = () => {
  playgroundBots = _.sampleSize(
    statisticBots,
    GAME_MIN_ALIVE_GAMES_AMOUNT + Math.round(GAME_MIN_ALIVE_GAMES_AMOUNT / 3),
  );
};
export const getRandomPlaygroundBot = () => _.sample(playgroundBots);

export const generatePayment = () => ({
  amount: _.random(0, 300),
  status: 'done',
  user: getRandomStatisticBot(),
  createdAt: randomDate(moment().add(-1, 'days'), moment()),
});
export const updatePayments = () => {
  payments = new Array(MIN_PAYMENTS_TO_SHOW).fill()
  .map(() => generatePayment());
};
export const updateFakes = async () => {
  await global.db.User.destroy({ where: { bot: true } });
  statisticBots = await generateStatisticBots(100);
  updatePlaygroundBots();
  updatePayments();
};
export const getRandomPayment = () => _.sample(payments);
export const getPayments = () => payments;

