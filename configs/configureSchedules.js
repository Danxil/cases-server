import checkGames from '../socketEvents/handlers/checkGames';
import checkConnectedUsers from '../socketEvents/handlers/checkConnectedUsers';
import addBot from '../socketEvents/handlers/addBot';
import { updateFakes } from '../controllers/fakes';
import {
  GAME_CHECK_INTERVAL,
  GAME_UPDATE_FAKES_INTERVAL,
} from '../gameConfig';

let lastUpdateFakes = new Date(0);

const check = async () => {
  try {
    await checkConnectedUsers();
    await checkGames();
    await addBot();
    if (
      lastUpdateFakes === null ||
      new Date().getTime() - lastUpdateFakes.getTime() >= GAME_UPDATE_FAKES_INTERVAL
    ) {
      await updateFakes();
      lastUpdateFakes = new Date();
    }

    setTimeout(check, GAME_CHECK_INTERVAL);
  } catch (e) {
    console.log(e);
  }
};

export default async () => {
  await check();
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
