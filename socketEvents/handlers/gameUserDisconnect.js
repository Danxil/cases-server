export default async ({
  ws,
  payload,
  gameCtrl,
}) => {
  const { gameId } = payload;
  const game = await gameCtrl.findGame({ gameId });
  if (!game) return;
  const updatedGame = await game.update({
    connectedUserId: null,
    lastTouchAt: null,
  });
  delete updatedGame.connectedUser;
  ws.send('*', 'GAME_UPDATED', { game: gameCtrl.convertGameToJson(updatedGame), reason: 'GAME_USER_DISCONNECTED' });
};
