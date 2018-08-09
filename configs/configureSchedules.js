import checkGames from '../socketEvents/handlers/checkGames';
import checkConnectedUsers from '../socketEvents/handlers/checkConnectedUsers';
import addBot from '../socketEvents/handlers/addBot';
import { updatePayments, updatePlaygroundBots, updateStatisticBots } from '../helpers/fakesUtils';
import {
  GAME_CHECK_ALIVE_GAMES_INTERVAL,
  GAME_ADD_BOT_INTERVAL,
  GAME_UPDATE_PLAYGROUND_BOTS_INTERVAL,
  UPDATE_STATISTIC_BOTS_INTERVAL,
  GAME_CHECK_CONNECTED_USERS_INTERVAL,
  UPDATE_PAYMENTS_FAKES_INTERVAL,
} from '../gameConfig';

export default async ({ gameCtrl, userCtrl, ws, db }) => {
  await checkGames({ gameCtrl, ws });
  setInterval(async () => {
    try {
      await checkGames({ gameCtrl, ws });
    } catch (e) {
      console.log(e);
    }
  }, GAME_CHECK_ALIVE_GAMES_INTERVAL);

  await checkConnectedUsers({ gameCtrl, ws });
  setInterval(async () => {
    console.log('memory', process.memoryUsage().rss);
    try {
      await checkConnectedUsers({ gameCtrl, ws });
    } catch (e) {
      console.log(e);
    }
  }, GAME_CHECK_CONNECTED_USERS_INTERVAL);

  setInterval(async () => {
    try {
      await addBot({ gameCtrl, userCtrl, ws, db });
    } catch (e) {
      console.log(e);
    }
  }, GAME_ADD_BOT_INTERVAL);

  setInterval(async () => {
    try {
      await updatePlaygroundBots();
    } catch (e) {
      console.log(e);
    }
  }, GAME_UPDATE_PLAYGROUND_BOTS_INTERVAL);

  setInterval(async () => {
    try {
      await updateStatisticBots();
    } catch (e) {
      console.log(e);
    }
  }, UPDATE_STATISTIC_BOTS_INTERVAL);

  setInterval(async () => {
    try {
      await updatePayments();
    } catch (e) {
      console.log(e);
    }
  }, UPDATE_PAYMENTS_FAKES_INTERVAL);
};
