import _ from 'lodash';
import gameSpin from './gameSpin';
import gameUserConnect from './gameUserConnect';
import { getRandomBot } from '../../controllers/fakes';
import { getNotExpiredGames } from '../../controllers/game';
import { GAME_MIN_ALIVE_GAMES_AMOUNT, LOW_LEVEL_GAMES_MIN_AMOUNT } from '../../gameConfig';

const addBot = async () => {
  const notExpiredGames = await getNotExpiredGames();
  const gamesNotInProgress = notExpiredGames.filter(o => !o.connectedUserId);
  console.log('inprogress', notExpiredGames.length - gamesNotInProgress.length);
  const botsAmountToCreate = (
    Math.round((GAME_MIN_ALIVE_GAMES_AMOUNT + LOW_LEVEL_GAMES_MIN_AMOUNT) / 10)
  ) - (notExpiredGames.length - gamesNotInProgress.length);
  if (botsAmountToCreate <= 0) return;
  console.log('botsAmountToCreate', botsAmountToCreate);
  for (let i = 0; i < botsAmountToCreate; i += 1) {
    const user = getRandomBot();
    if (!user) return;

    const { id: gameId, chanceToWin } = _.sample(gamesNotInProgress);
    await gameUserConnect({
      user,
      payload: { gameId },
    });
    const result = Math.random() >= chanceToWin / 100;
    setTimeout(() => {
      gameSpin({
        payload: { gameId, result },
        user,
        botMode: true,
      }).catch((e) => {
        console.log(e);
      });
    }, _.random(0, 10000));
  }
  console.log('DONE');
};

export default addBot;
