import _ from 'lodash';
import moment from 'moment';
import rp from 'request-promise';
import faker from 'faker';
import { Op } from 'sequelize';
import { MIN_WITHDRAWS_TO_SHOW, GAMES_IN_TABLE, TABLES_AMOUNT, START_BOT_BALANCE } from '../gameConfig';

let bots = [];
let withdraws = [];
const randomDate = (start, end) => {
  return new Date(
    start.valueOf() + (Math.random() * (end.valueOf() - start.valueOf())),
  );
};

export const generateBot = async ({ card }) => {
  const user = await global.db.User.create({ bot: true });
  if (card.gender === 'male') {
    user.photo = card.picture.thumbnail;
    faker.locale = _.sample(['en', 'ru']);
    user.displayName = `${faker.name.firstName(0)} ${faker.name.lastName(0)}`;
  } else {
    faker.locale = 'en';
    user.displayName = `${faker.helpers.contextualCard().username.slice(0, _.random(5, 10))}`;
  }
  user.balance = START_BOT_BALANCE;
  return user;
};

export const generateBots = async (amount) => {
  const fakePersons = await rp({
    uri: `https://randomuser.me/api/?results=${amount}&inc=gender,name,picture`,
    json: true,
  });
  const result = await Promise.all(
    Array(amount).fill().map((o, index) => generateBot({ card: fakePersons.results[index] })),
  );
  return result;
};
export const getRandomBot = () => _.sample(bots);
export const getBots = () => bots;
export const updateBots = async () => {
  let gamesInProgressWithBots;
  if (bots.length) {
    gamesInProgressWithBots = await global.db.Game.findAll({
      where: {
        connectedUserId: {
          [Op.any]: bots.map(o => o.id),
        },
      },
    });
  } else {
    gamesInProgressWithBots = [];
  }

  const botsInProgressIds = gamesInProgressWithBots.map(o => o.connectedUserId);
  const amountOfDeletedBots = await global.db.User.destroy({
    where: {
      bot: true,
      id: { [Op.notIn]: botsInProgressIds },
    },
  });
  const botsToCreate = !bots.length ?
    Math.round((GAMES_IN_TABLE * TABLES_AMOUNT) / 2) :
    amountOfDeletedBots;
  const remainedBots = bots.filter(o => botsInProgressIds.indexOf(o.id) !== -1);
  const newBots = await generateBots(botsToCreate);
  bots = [...remainedBots, ...newBots];
};

export const generateWithdraw = () => ({
  amount: _.random(0, 300),
  status: 'done',
  user: getRandomBot() || {},
  createdAt: randomDate(moment().add(-1, 'days'), moment()),
});
export const updateWithdraws = () => {
  withdraws = new Array(MIN_WITHDRAWS_TO_SHOW).fill()
  .map(() => generateWithdraw());
};
export const getRandomWithdraws = () => _.sample(withdraws);
export const getWithdraws = () => withdraws;

export const updateFakes = async () => {
  await updateBots();
  updateWithdraws();
};
