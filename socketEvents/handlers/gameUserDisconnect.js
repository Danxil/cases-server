export default async ({
  ws,
  gameCtrl,
  payload,
  user,
}) => {
  const { gameId } = payload;
  const gameAction = await gameCtrl.createGameAction({
    gameId,
    userId: user.id,
    user,
    type: 'GAME_USER_DISCONNECTED',
  });
  if (gameAction) {
    ws.send('*', gameAction.type, { userId: user.id, gameId, user, ...payload });
  }
};
