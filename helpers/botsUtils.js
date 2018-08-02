import faker from 'faker';
import _ from 'lodash';
import request from 'request-promise';
import { GAME_MIN_ALIVE_GAMES_AMOUNT } from '../gameConfig';

let statisticBots = [];
let playgroundBotsInProgress = [];
let playgroundBots = [];

export const generateBot = async () => {
  let photo;
  try {
    const randomUser = await request('https://randomuser.me/api/');
    photo = JSON.parse(randomUser).results[0].picture.thumbnail;
  } catch (e) {
    photo = null;
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
export const updateStatisticBots = async (amount) => {
  statisticBots = await generateStatisticBots(amount);
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

generateStatisticBots(50)
.then((result) => {
  statisticBots = result;
  updatePlaygroundBots(
    GAME_MIN_ALIVE_GAMES_AMOUNT +
    Math.round(GAME_MIN_ALIVE_GAMES_AMOUNT / 3),
  );
  return result;
})
.catch(e => console.log(e));
