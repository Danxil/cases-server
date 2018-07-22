import { CONNECT_TO_GAME, GAME_USER_CONNECTED } from '../actionsTypes';

export default ({ ws, gameCtrl }) => {
  ws.on('message', async ({ id: userId }, { type, payload }) => {
    switch (type) {
      case CONNECT_TO_GAME: {
        const isGameInProgress = await gameCtrl.isGameInProgress({ id: payload.gameId });
        if (isGameInProgress) {
          ws.send(userId, 'GAME_ALREADY_IN_PROGRESS', { gameId: payload.gameId });
          break;
        }
        await gameCtrl.createGameAction({
          type: GAME_USER_CONNECTED,
          payload,
          gameId: payload.gameId,
          userId,
        });
        break;
      }
      default:
    }
  });
};
