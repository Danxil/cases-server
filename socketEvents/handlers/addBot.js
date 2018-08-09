import _ from 'lodash';
import gameSpin from './gameSpin';
import gameUserConnect from './gameUserConnect';
import { getRandomPlaygroundBot } from '../../helpers/fakesUtils';
import { GAME_MIN_ALIVE_GAMES_AMOUNT } from '../../gameConfig';

export default async ({
  ws,
  db,
  gameCtrl,
  userCtrl,
}) => {
  const notExpiredGames = await gameCtrl.getNotExpiredGames();
  const map = await Promise.all(notExpiredGames.map(async (game) => {
    if (game.connectedUserId) return null;
    return game;
  }));

  const gamesNotInProgress = map.filter(o => o);

  if (
    !gamesNotInProgress.length ||
    notExpiredGames.length - gamesNotInProgress.length >= Math.round(
      GAME_MIN_ALIVE_GAMES_AMOUNT / 3,
    )
  ) return;
  const user = await userCtrl.createBot();
  const bot = getRandomPlaygroundBot();

  if (!bot) return;

  user.displayName = bot.displayName;
  user.photo = bot.photo;

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
