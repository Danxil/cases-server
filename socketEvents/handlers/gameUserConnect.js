export default async ({
  ws,
  gameCtrl,
  user,
  payload,
}) => {
  const { gameId } = payload;
  const game = await gameCtrl.findGame({ gameId });
  if (!game || game.connectedUserId) return;
  const updatedGame = await game.update({
    connectedUserId: user.id,
    lastTouchAt: new Date(),
  });
  updatedGame.connectedUser = user;
  ws.send('*', 'GAME_UPDATED', { game: gameCtrl.convertGameToJson(updatedGame), reason: 'GAME_USER_CONNECTED' });
};
