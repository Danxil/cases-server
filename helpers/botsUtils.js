import faker from 'faker';
import _ from 'lodash';
import { GAME_MIN_ALIVE_GAMES_AMOUNT } from '../gameConfig';

let statisticBots = [];
let playgroundBotsInProgress = [];
let playgroundBots = [];

export const generateBot = () => ({
  photo: faker.image.avatar(),
  balance: _.random(1000, 5000),
  displayName: `${faker.name.firstName()} ${faker.name.lastName()}`,
});

export const generateStatisticBots = amount => Array(amount).fill().map(() => generateBot());
export const updateStatisticBots = (amount) => {
  statisticBots = generateStatisticBots(amount);
};
export const updatePlaygroundBots = (amount) => {
  playgroundBots = _.sampleSize(statisticBots, amount);
};
export const getRandomPlaygroundBot = () => _.sample(
  playgroundBots.filter(o => !playgroundBotsInProgress.find(oo => oo.photo === o.photo)),
);
export const setPlaygroundBotInProgress = bot => playgroundBotsInProgress.push(bot);
export const removePlaygroundBotFromInProgress = (bot) => {
  playgroundBotsInProgress = playgroundBotsInProgress.filter(o => o.photo !== bot.photo);
};
export const getStatisticBots = () => statisticBots.sort((a, b) => {
  return a.balance > b.balance ? -1 : 1;
});

statisticBots = generateStatisticBots(50);
updatePlaygroundBots(
  GAME_MIN_ALIVE_GAMES_AMOUNT +
  Math.round(GAME_MIN_ALIVE_GAMES_AMOUNT / 3),
);
