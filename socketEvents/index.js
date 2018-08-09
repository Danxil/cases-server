import createGame from './handlers/createGame';
import gameSpin from './handlers/gameSpin';
import gameUserDisconnect from './handlers/gameUserDisconnect';
import gameUserConnect from './handlers/gameUserConnect';

export default ({ ws, db, gameCtrl }) => {
  ws.on('message', async (user, { type, payload }) => {
    switch (type) {
      case 'NOTIFICATION_GAME_USER_CONNECT': {
        gameUserConnect({ ws, db, gameCtrl, user, payload });
        break;
      }
      case 'NOTIFICATION_GAME_USER_DISCONNECT': {
        await gameUserDisconnect({ ws, db, gameCtrl, payload, user });
        break;
      }
      case 'NOTIFICATION_GAME_SPIN_START': {
        await gameSpin({ ws, db, gameCtrl, payload, user });
        break;
      }
      case 'NOTIFICATION_CREATE_GAME': {
        await createGame({ ws, db, gameCtrl, payload, user });
        break;
      }
      default:
    }
  });
};
