import {
  CONNECT_TO_GAME,
  GAME_USER_CONNECTED,
  DISCONNECT_FROM_GAME,
  GAME_USER_DISCONNECTED,
} from '../actionsTypes';

export default ({ ws, gameCtrl }) => {
  ws.on('message', async (user, { type, payload }) => {
    switch (type) {
      case CONNECT_TO_GAME: {
        const isGameInProgress = await gameCtrl.isGameInProgress({ id: payload.gameId });
        if (isGameInProgress) break;
        await gameCtrl.createGameAction({
          type: GAME_USER_CONNECTED,
          payload: { user: user.toJSON() },
          gameId: payload.gameId,
          userId: user.id,
        });
        break;
      }
      case DISCONNECT_FROM_GAME: {
        await gameCtrl.createGameAction({
          gameId: payload.gameId,
          userId: user.id,
          type: GAME_USER_DISCONNECTED,
        });
        break;
      }
      default:
    }
  });
};
