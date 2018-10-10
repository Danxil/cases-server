import checkGames from '../socketEvents/handlers/checkGames';
import checkConnectedUsers from '../socketEvents/handlers/checkConnectedUsers';
import addBot from '../socketEvents/handlers/addBot';
import { updateFakes } from '../controllers/fakes';
import {
  GAME_CHECK_ALIVE_GAMES_INTERVAL,
  GAME_ADD_BOT_INTERVAL,
  GAME_UPDATE_FAKES_INTERVAL,
  GAME_CHECK_CONNECTED_USERS_INTERVAL,
} from '../gameConfig';

export default async () => {
  await checkGames();
  setInterval(async () => {
    try {
      await checkGames();
    } catch (e) {
      console.log(e);
    }
  }, GAME_CHECK_ALIVE_GAMES_INTERVAL);

  await checkConnectedUsers();
  setInterval(async () => {
    try {
      await checkConnectedUsers();
    } catch (e) {
      console.log(e);
    }
  }, GAME_CHECK_CONNECTED_USERS_INTERVAL);

  setInterval(async () => {
    try {
      await addBot();
    } catch (e) {
      console.log(e);
    }
  }, GAME_ADD_BOT_INTERVAL);

  setInterval(async () => {
    try {
      await updateFakes();
    } catch (e) {
      console.log(e);
    }
  }, GAME_UPDATE_FAKES_INTERVAL);

  setInterval(() => {
    const heapUsed = process.memoryUsage().heapUsed / 1024 / 1024;
    const heapTotal = process.memoryUsage().heapTotal / 1024 / 1024;
    const rss = process.memoryUsage().rss / 1024 / 1024;
    const external = process.memoryUsage().external / 1024 / 1024;
    console.log('======');
    console.log(`The script uses approximately heapUsed ${Math.round(heapUsed * 100) / 100} MB`);
    console.log(`The script uses approximately heapTotal ${Math.round(heapTotal * 100) / 100} MB`);
    console.log(`The script uses approximately rss ${Math.round(rss * 100) / 100} MB`);
    console.log(`The script uses approximately external ${Math.round(external * 100) / 100} MB`);
    console.log('======');
  }, 1000);
};
