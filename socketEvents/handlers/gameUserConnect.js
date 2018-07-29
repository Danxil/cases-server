export default async ({
  ws,
  gameCtrl,
  user,
  payload,
}) => {
  const { gameId } = payload;
  const isGameInProgress = await gameCtrl.isGameInProgress({ gameId });
  if (isGameInProgress) return;
  const gameAction = await gameCtrl.createGameAction({
    type: 'GAME_USER_CONNECTED',
    payload: { user },
    gameId,
    userId: user.id,
  });
  if (gameAction) {
    ws.send('*', gameAction.type, { userId: user.id, gameId, user, ...payload });
  }
};
