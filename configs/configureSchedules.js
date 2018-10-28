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
    console.log(1, new Date().getTime());
    console.log(2, lastUpdateFakes.getTime());
    if (
      new Date().getTime() - lastUpdateFakes.getTime() >= GAME_UPDATE_FAKES_INTERVAL
      // lastUpdateFakes.getTime() === new Date(0).getTime()
    ) {
      console.log(3);
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
};
