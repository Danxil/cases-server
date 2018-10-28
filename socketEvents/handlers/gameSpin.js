import { GAME_SPIN_DELAY } from '../../gameConfig';
import { convertGameToJson, findGame, checkBeforeGameAction } from '../../controllers/game';

const gameSpinStart = async ({ game, user, result: clientResult }) => {
  const gameJson = convertGameToJson(game);
  const updateObj = { spinInProgress: true };
  const result = user.isDemoMode ?
    clientResult :
    !!parseInt(game.schema[game.getAttemptsAmount()], 10);
  const updateUserObject = {
    balance: user.balance += result ? game.prize : -game.risk,
  };

  if (result) {
    updateObj.won = game.won + 1;
    updateUserObject.gamesWon = user.gamesWon + 1;
  } else {
    updateObj.lost = game.lost + 1;
    updateUserObject.gamesLose = user.gamesLose + 1;
  }

  const { updatedGame, updatedUser } = await global.db.sequelize
  .transaction(async (transaction) => {
    const uGame = await game.update(updateObj, { transaction });
    const uUser = await user.update(updateUserObject, { transaction });
    return { updatedGame: uGame, updatedUser: uUser };
  });
  gameJson.spinInProgress = true;
  global.ws.send('*', 'GAME_UPDATED', { game: gameJson, reason: 'GAME_SPIN_START' });
  return { updatedUser, updatedGame };
};

const gameSpinDone = async ({
  result,
  user,
  game,
  botMode,
}) => {
  const { creatorUser } = game;
  const updatedGame = await game.update({ spinInProgress: false, lastTouchAt: new Date() });
  global.ws.send('*', 'GAME_UPDATED', { game: convertGameToJson(updatedGame), reason: 'GAME_SPIN_DONE', result });
  if (creatorUser && !result) {
    const updatedCreatorUser = await creatorUser.update({
      balance: creatorUser.balance + game.prize + game.risk,
    });
    global.ws.send(updatedCreatorUser.id, 'USER_UPDATED', updatedCreatorUser);
  }
  if (!botMode) global.ws.send(user.id, 'USER_UPDATED', user);
};

export default async ({
  payload,
  user,
  botMode = false,
}) => {
  const { gameId, result } = payload;
  const game = await findGame({ gameId });
  const checkResult = await checkBeforeGameAction({ user, game });
  if (!checkResult) return;
  const {
    updatedUser,
    updatedGame,
  } = await gameSpinStart({ game, user, result });
  await new Promise(resolve => setTimeout(resolve, GAME_SPIN_DELAY));
  await gameSpinDone({
    payload,
    user: updatedUser,
    game: updatedGame,
    botMode,
  });
};
