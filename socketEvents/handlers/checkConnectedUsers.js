export default async ({
  ws,
  gameCtrl,
}) => {
  const {
    gameUserDisconnectGameActions,
  } = await gameCtrl.checkAndDisconnectConnectedGameUsers();
  if (gameUserDisconnectGameActions.length) {
    ws.send('*', 'PLAYGROUND_UPDATED', {
      expiredGamesIds: [],
      gameUserDisconnectGameActions,
      createdGames: [],
      notifyUsersCreatorsIdsAboutGameExpired: [],
    });
  }
};
