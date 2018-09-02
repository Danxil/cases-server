import _ from 'lodash';
import gameSpin from './gameSpin';
import gameUserConnect from './gameUserConnect';
import { getRandomBot } from '../../controllers/fakes';
import { getNotExpiredGames } from '../../controllers/game';
import { GAME_MIN_ALIVE_GAMES_AMOUNT } from '../../gameConfig';

export default async () => {
  const notExpiredGames = await getNotExpiredGames();
  const gamesNotInProgress = notExpiredGames.filter(o => !o.connectedUserId);

  if (
    !gamesNotInProgress.length ||
    notExpiredGames.length - gamesNotInProgress.length >= Math.round(
      GAME_MIN_ALIVE_GAMES_AMOUNT / 3,
    )
  ) return;
  const user = getRandomBot();
  if (!user) return;

  const { id: gameId, chanceToWin, prize, risk } = _.sample(gamesNotInProgress);
  await gameUserConnect({
    user,
    payload: { gameId },
  });
  const result = Math.random() >= chanceToWin / 100;
  await gameSpin({
    payload: { gameId, result: result ? prize : -risk },
    user,
    botMode: true,
  });
};
