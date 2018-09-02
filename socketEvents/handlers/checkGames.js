import { checkAndExpireNotExpiredGames } from '../../controllers/game';

export default async () => {
  const {
    expiredGamesIds,
    createdGames,
    notifyUsersCreatorsIdsAboutGameExpired,
    usersToUpdate,
  } = await checkAndExpireNotExpiredGames();
  if (usersToUpdate.length) {
    usersToUpdate.forEach(o => global.ws.send(o.id, 'USER_UPDATED', o));
  }
  if (expiredGamesIds.length || createdGames.length) {
    global.ws.send('*', 'PLAYGROUND_UPDATED', {
      expiredGamesIds,
      gameUsersDisconnected: [],
      createdGames: createdGames.map(o => ({
        ...o.toJSON(),
        creatorUser: o.creatorUser ? o.creatorUser.toJSON() : null,
      })),
      notifyUsersCreatorsIdsAboutGameExpired,
    });
  }
};
