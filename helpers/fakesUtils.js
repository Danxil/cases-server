import faker from 'faker';
import _ from 'lodash';
import moment from 'moment';
import request from 'request-promise';
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
  let photo;
  try {
    const randomUser = await request('https://randomuser.me/api/');
    photo = JSON.parse(randomUser).results[0].picture.thumbnail;
  } catch (e) {
    photo = Math.random();
  }
  return {
    photo,
    balance: _.random(1000, 5000),
    displayName: `${faker.name.firstName()} ${faker.name.lastName()}`,
  };
};

export const generateStatisticBots = amount => Promise.all(
  Array(amount).fill().map(() => generateBot()),
);
export const getRandomStatisticBot = () => _.sample(statisticBots);
export const getStatisticBots = () => statisticBots.sort((a, b) => {
  return a.balance > b.balance ? -1 : 1;
});
export const updateStatisticBots = async (amount) => {
  statisticBots = await generateStatisticBots(amount);
};

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
export const getRandomPayment = () => _.sample(payments);
export const getPayments = () => payments;

generateStatisticBots(50)
.then((result) => {
  statisticBots = result;
  updatePlaygroundBots();
  updatePayments();
  return result;
})
.catch(e => console.log(e));
