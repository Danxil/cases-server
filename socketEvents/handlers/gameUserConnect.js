import { findGame, checkBeforeGameAction, convertGameToJson } from '../../controllers/game';

export default async ({
  user,
  payload,
}) => {
  const { gameId } = payload;
  const game = await findGame({ gameId });
  if (!game || game.connectedUserId) return;
  const checkResult = await checkBeforeGameAction({ user, game });
  if (!checkResult) return;
  const updatedGame = await game.update({
    connectedUserId: user.id,
    lastTouchAt: new Date(),
  });
  updatedGame.connectedUser = user;
  global.ws.send('*', 'GAME_UPDATED', { game: convertGameToJson(updatedGame), reason: 'GAME_USER_CONNECTED' });
};
