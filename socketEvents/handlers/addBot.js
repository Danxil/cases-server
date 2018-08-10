import _ from 'lodash';
import gameSpin from './gameSpin';
import gameUserConnect from './gameUserConnect';
import { getRandomPlaygroundBot } from '../../controllers/fakes';
import { GAME_MIN_ALIVE_GAMES_AMOUNT } from '../../gameConfig';

export default async ({
  ws,
  db,
  gameCtrl,
}) => {
  const notExpiredGames = await gameCtrl.getNotExpiredGames();

  const gamesNotInProgress = notExpiredGames.filter(o => !o.connectedUserId);

  if (
    !gamesNotInProgress.length ||
    notExpiredGames.length - gamesNotInProgress.length >= Math.round(
      GAME_MIN_ALIVE_GAMES_AMOUNT / 3,
    )
  ) return;
  const user = getRandomPlaygroundBot();
  if (!user) return;

  const { id: gameId, chanceToWin, prize, risk } = _.sample(gamesNotInProgress);
  await gameUserConnect({
    ws,
    db,
    gameCtrl,
    user,
    payload: { gameId },
  });
  const result = Math.random() >= chanceToWin / 100;
  await gameSpin({
    ws,
    db,
    gameCtrl,
    payload: { gameId, result: result ? prize : -risk },
    user,
    botMode: true,
  });
};
