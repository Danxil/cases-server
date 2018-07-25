import {
  NOTIFICATION_GAME_USER_CONNECT,
  GAME_USER_CONNECTED,
  NOTIFICATION_GAME_USER_DISCONNECT,
  GAME_USER_DISCONNECTED,
  GAME_SPIN,
  NOTIFICATION_GAME_SPIN,
  NOTIFICATION_CREATE_GAME,
} from '../actionsTypes';

export default ({ ws, gameCtrl, userCtrl }) => {
  ws.on('message', async (user, { type, payload }) => {
    switch (type) {
      case NOTIFICATION_GAME_USER_CONNECT: {
        const isGameInProgress = await gameCtrl.isGameInProgress({ gameId: payload.gameId });
        if (isGameInProgress) break;
        await gameCtrl.createGameAction({
          type: GAME_USER_CONNECTED,
          payload: { user: user.toJSON() },
          gameId: payload.gameId,
          userId: user.id,
        });
        break;
      }
      case NOTIFICATION_GAME_USER_DISCONNECT: {
        await gameCtrl.createGameAction({
          gameId: payload.gameId,
          userId: user.id,
          type: GAME_USER_DISCONNECTED,
        });
        break;
      }
      case NOTIFICATION_GAME_SPIN: {
        const { gameId } = payload;
        const result = await gameCtrl.checkBeforeNotificationGameSpin({ user, gameId });
        if (!result) return;
        await gameCtrl.createGameAction({
          gameId: payload.gameId,
          userId: user.id,
          type: NOTIFICATION_GAME_SPIN,
        });
        const updatedUser = await userCtrl.update(
          user,
          { balance: user.balance += payload.result },
          { notify: false },
        );
        await new Promise(resolve => setTimeout(resolve, process.env.GAME_GAME_SPIN_DELAY));
        await gameCtrl.createGameAction({
          gameId: payload.gameId,
          userId: user.id,
          type: GAME_SPIN,
          payload,
        });
        ws.send(user.id, 'USER_UPDATED', updatedUser);
        break;
      }
      case NOTIFICATION_CREATE_GAME: {
        const { game } = payload;
        await gameCtrl.createGame({ defaults: game, creatorUser: user });
        break;
      }
      default:
    }
  });
};
