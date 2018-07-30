import { GAME_GAME_SPIN_DELAY } from '../../gameConfig';

const gameSpinStart = async ({ game, user, result, gameCtrl, ws }) => {
  const gameActionStart = await gameCtrl.createGameAction({
    game,
    userId: user.id,
    user,
    type: 'GAME_SPIN_START',
  });
  if (!gameActionStart) return null;
  const updatedUser = await user.update(
    { balance: user.balance += result },
  );
  ws.send('*', gameActionStart.type, { userId: user.id, gameId: game.id, user });
  return updatedUser;
};

const gameSpinDone = async ({
  ws,
  game,
  user,
  payload,
  result,
  gameCtrl,
  updatedUser,
  botMode,
  // db,
}) => {
  const { creatorUser } = game;
  const gameActionDone = await gameCtrl.createGameAction({
    game,
    userId: user.id,
    user,
    type: 'GAME_SPIN_DONE',
    payload,
  });
  if (!gameActionDone) return;
  ws.send('*', gameActionDone.type, { userId: user.id, gameId: game.id, user, game, ...payload });
  if (creatorUser && result < 0) {
    const updatedCreatorUser = await creatorUser.update({
      balance: creatorUser.balance + game.prize + game.risk,
    });
    ws.send(updatedCreatorUser.id, 'USER_UPDATED', updatedCreatorUser);
  }
  if (!botMode) ws.send(user.id, 'USER_UPDATED', updatedUser);
};

export default async ({
  ws,
  gameCtrl,
  payload,
  user,
  botMode = false,
}) => {
  const { gameId, result } = payload;
  const game = await gameCtrl.findGame({ gameId });
  const checkResult = await gameCtrl.checkBeforeNotificationGameSpin({ user, game });
  if (!checkResult) return;
  const updatedUser = await gameSpinStart({ game, user, result, gameCtrl, ws });
  if (!updatedUser) return;
  await new Promise(resolve => setTimeout(resolve, GAME_GAME_SPIN_DELAY));
  await gameSpinDone({ ws, game, user, payload, result, gameCtrl, updatedUser, botMode });
};
