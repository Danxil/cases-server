import { checkAndDisconnectConnectedGameUsers } from '../../controllers/game';

export default async () => {
  const {
    gameUsersDisconnected,
  } = await checkAndDisconnectConnectedGameUsers();
  if (gameUsersDisconnected.length) {
    global.ws.send('*', 'PLAYGROUND_UPDATED', {
      expiredGamesIds: [],
      gameUsersDisconnected,
      createdGames: [],
      notifyUsersCreatorsIdsAboutGameExpired: [],
    });
  }
};
