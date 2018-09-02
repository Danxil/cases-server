import { findGame, convertGameToJson } from '../../controllers/game';

export default async ({
  payload,
}) => {
  const { gameId } = payload;
  const game = await findGame({ gameId });
  if (!game) return;
  const updatedGame = await game.update({
    connectedUserId: null,
    lastTouchAt: null,
  });
  delete updatedGame.connectedUser;
  global.ws.send('*', 'GAME_UPDATED', { game: convertGameToJson(updatedGame), reason: 'GAME_USER_DISCONNECTED' });
};
