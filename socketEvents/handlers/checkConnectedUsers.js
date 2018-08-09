export default async ({
  ws,
  gameCtrl,
}) => {
  const {
    gameUsersDisconnected,
  } = await gameCtrl.checkAndDisconnectConnectedGameUsers();
  if (gameUsersDisconnected.length) {
    ws.send('*', 'PLAYGROUND_UPDATED', {
      expiredGamesIds: [],
      gameUsersDisconnected,
      createdGames: [],
      notifyUsersCreatorsIdsAboutGameExpired: [],
    });
  }
};
