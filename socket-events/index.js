import {
  CONNECT_TO_GAME,
  GAME_USER_CONNECTED,
  DISCONNECT_FROM_GAME,
  GAME_USER_DISCONNECTED,
  GAME_SPIN,
  NOTIFICATION_GAME_SPIN,
} from '../actionsTypes';

export default ({ ws, gameCtrl, userCtrl }) => {
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
      case NOTIFICATION_GAME_SPIN: {
        const { gameId } = payload;
        const result = await gameCtrl.checkBeforeGameSpin({ user, gameId });
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
      default:
    }
  });
};
