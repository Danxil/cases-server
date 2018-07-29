import checkGames from '../socketEvents/handlers/checkGames';
import addBot from '../socketEvents/handlers/addBot';
import { updatePhotos, updateStatisticBots } from '../helpers/botsUtils';

export default({ gameCtrl, userCtrl, ws }) => {
  setInterval(async () => {
    try {
      await checkGames({ gameCtrl, ws });
    } catch (e) {
      console.log(e);
    }
  }, process.env.GAME_CHECK_ALIVE_GAMES_INTERVAL);

  setInterval(async () => {
    try {
      await addBot({ gameCtrl, userCtrl, ws });
    } catch (e) {
      console.log(e);
    }
  }, process.env.GAME_ADD_BOT_INTERVAL);

  setInterval(async () => {
    try {
      updatePhotos(10);
    } catch (e) {
      console.log(e);
    }
  }, process.env.GAME_UPDATE_BOTS_PHOTOS);

  setInterval(async () => {
    try {
      updateStatisticBots(50);
    } catch (e) {
      console.log(e);
    }
  }, process.env.GAME_UPDATE_STATISTIC_BOTS);
};
