import createGame from './handlers/createGame';
import gameSpin from './handlers/gameSpin';
import gameUserDisconnect from './handlers/gameUserDisconnect';
import gameUserConnect from './handlers/gameUserConnect';

export default () => {
  global.ws.on('message', async (user, { type, payload }) => {
    switch (type) {
      case 'NOTIFICATION_GAME_USER_CONNECT': {
        gameUserConnect({ user, payload });
        break;
      }
      case 'NOTIFICATION_GAME_USER_DISCONNECT': {
        await gameUserDisconnect({ payload, user });
        break;
      }
      case 'NOTIFICATION_GAME_SPIN_START': {
        await gameSpin({ payload, user });
        break;
      }
      case 'NOTIFICATION_CREATE_GAME': {
        await createGame({ payload, user });
        break;
      }
      default:
    }
  });
};
