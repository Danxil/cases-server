import { GAME_GAME_SPIN_DELAY } from '../../gameConfig';

const gameSpinStart = async ({ game, gameCtrl, user, result, ws, db }) => {
  const updateObj = { spinInProgress: true };
  if (result > 0) updateObj.won = game.won + 1;
  else updateObj.lost = game.lost + 1;

  const { updatedGame, updatedUser } = await db.sequelize.transaction(async (transaction) => {
    const uGame = await game.update(updateObj, { transaction });
    const uUser = await user.update(
      { balance: user.balance += result },
      { transaction },
    );
    return { updatedGame: uGame, updatedUser: uUser };
  });
  const gameJson = gameCtrl.convertGameToJson(game);
  gameJson.spinInProgress = true;
  ws.send('*', 'GAME_UPDATED', { game: gameJson, user, reason: 'GAME_SPIN_START' });
  return { updatedUser, updatedGame };
};

const gameSpinDone = async ({
  ws,
  result,
  user,
  game,
  botMode,
  gameCtrl,
}) => {
  const { creatorUser } = game;
  const updatedGame = await game.update({ spinInProgress: false, lastTouchAt: new Date() });
  ws.send('*', 'GAME_UPDATED', { game: gameCtrl.convertGameToJson(updatedGame), reason: 'GAME_SPIN_DONE', result });
  if (creatorUser && result < 0) {
    const updatedCreatorUser = await creatorUser.update({
      balance: creatorUser.balance + game.prize + game.risk,
    });
    ws.send(updatedCreatorUser.id, 'USER_UPDATED', updatedCreatorUser);
  }
  if (!botMode) ws.send(user.id, 'USER_UPDATED', user);
};

export default async ({
  ws,
  db,
  gameCtrl,
  payload,
  user,
  botMode = false,
}) => {
  const { gameId, result } = payload;
  const game = await gameCtrl.findGame({ gameId });
  const checkResult = await gameCtrl.checkBeforeNotificationGameSpin({ user, game });
  if (!checkResult) return;
  const {
    updatedUser,
    updatedGame,
  } = await gameSpinStart({ db, game, user, result, gameCtrl, ws });
  await new Promise(resolve => setTimeout(resolve, GAME_GAME_SPIN_DELAY));
  await gameSpinDone({
    ws,
    db,
    payload,
    gameCtrl,
    result,
    user: updatedUser,
    game: updatedGame,
    botMode,
  });
};
