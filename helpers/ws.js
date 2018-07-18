import url from 'url';
import jwt from 'jsonwebtoken';
import { wsGenerateMessage, wsParseMessage } from 'pty-common/ws-message';
import { JWT_SECRET } from '../config';

export default class WS {
  constructor(wsServer, db) {
    this.wsServer = wsServer;
    this.db = db;
    this.messageEventMap = {};
    this.userIdSocketMap = {};

    this.connectionHandler();
  }

  connectionHandler() {
    this.wsServer.on('connection', async (socket) => {
      const { query: { token } } = url.parse(socket.upgradeReq.url, true);
      const userData = jwt.verify(token, JWT_SECRET);

      const user = await this.db.User.findOne({ where: { id: userData.id } });

      if (user) {
        this.send(user.id, 'LOG_OUT');

        setTimeout(() => {
          this.userIdSocketMap[userData.id] = socket;

          this.assignEvents(socket);

          socket.send(wsGenerateMessage('SUBSCRIBED', user));
        }, 1000);
      }
    });
  }

  on(type, cb) {
    this.messageEventMap[type] = (payload, token) => {
      const userData = jwt.verify(token, JWT_SECRET);

      if (userData) {
        cb(payload, userData);

        console.log(`recieved ${type} from userId ${userData.id} with payload ${JSON.stringify(payload).substr(0, 10000)}`);
      }
    };
  }

  assignEvents(socket) {
    socket.on('message', (message) => {
      const { type, payload, token } = wsParseMessage(message);

      if (this.messageEventMap[type]) {
        this.messageEventMap[type](payload, token);
      }
    });
  }

  send(userIds, type, payload = {}) {
    let userIdsArr;

    if (!Array.isArray(userIds)) {
      userIdsArr = [userIds];
    } else {
      userIdsArr = userIds;
    }

    userIdsArr.forEach((userId) => {
      const socket = this.userIdSocketMap[userId];

      if (socket) {
        socket.send(wsGenerateMessage(type, payload), (err) => {
          if (err) {
            console.error(err);
          }
        });
      }
    });

    console.log(`sent ${type} to userIds ${JSON.stringify(userIds)} with payload ${JSON.stringify(payload).substr(0, 10000)} `);
  }
}
