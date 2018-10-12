import _ from 'lodash';
import moment from 'moment';
import { Op } from 'sequelize';
import { MIN_WITHDRAWS_TO_SHOW, GAMES_IN_TABLE, TABLES_AMOUNT } from '../gameConfig';

let bots = [];
let withdraws = [];
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
    Math.round((GAMES_IN_TABLE * TABLES_AMOUNT) / 2) - amountOfDeletedBots :
    amountOfDeletedBots;
  const remainedBots = bots.filter(o => botsInProgressIds.indexOf(o.id) !== -1);
  const newBots = await generateBots(botsToCreate);
  bots = [...remainedBots, ...newBots];
};

export const generateWithdraw = () => ({
  amount: _.random(0, 300),
  status: 'done',
  user: getRandomBot(),
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
