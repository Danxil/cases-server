import WebSocket from 'ws';
import passport from 'passport';
import { wsGenerateMessage, wsParseMessage } from 'pty-common/ws-message';

export default class WS {
  static getWsServerConfig({ server, sessionParser }) {
    return {
      port: 5001,
      perMessageDeflate: false,
      server,
      verifyClient: ({ req }, done) => {
        sessionParser(req, {}, () => {
          passport.initialize()(req, {}, () => {
            passport.session()(req, {}, () => {
              done(!!req.user);
            });
          });
        });
      },
    };
  }

  constructor({ server, db, sessionParser }) {
    this.wsServer = new WebSocket.Server(WS.getWsServerConfig({ server, sessionParser }));
    this.db = db;
    this.messageEventMap = {};
    this.userIdSocketMap = {};

    this.wsServer.on('connection', (socket, req) => {
      this.handshakeCb({ socket, req });
    });
  }


  handshakeCb({ socket, req: { user } }) {
    this.send(user.id, 'LOG_OUT');
    setTimeout(() => {
      this.userIdSocketMap[user.id] = socket;
      this.initMessageCb(socket);
      socket.send(wsGenerateMessage('SUBSCRIBED', user));
    }, 1000);
  }

  on(type, cb) {
    this.messageEventMap[type] = (payload) => {
      const userData = {};

      if (userData) {
        cb(payload, userData);

        console.log(`recieved ${type} from userId ${userData.id} with payload ${JSON.stringify(payload).substr(0, 10000)}`);
      } else {
        console.log('WS auth failed!');
      }
    };
  }

  initMessageCb(socket) {
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
