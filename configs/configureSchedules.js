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
    if (
      new Date().getTime() - lastUpdateFakes.getTime() >= GAME_UPDATE_FAKES_INTERVAL
      // lastUpdateFakes.getTime() === new Date(0).getTime()
    ) {
      await updateFakes();
      lastUpdateFakes = new Date();
    }
    await checkConnectedUsers();
    await checkGames();
    await addBot();
  } catch (e) {
    console.log(e);
  }
  setTimeout(check, GAME_CHECK_INTERVAL);
};

export default async () => {
  await check();
};
