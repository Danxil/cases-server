import WebSocket from 'ws';
import passport from 'passport';

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

  constructor({ server, db, sessionParser, connectionCb }) {
    this.wsServer = new WebSocket.Server(WS.getWsServerConfig({ server, sessionParser }));
    this.db = db;
    this.messageEventMap = {};
    this.userIdSocketMap = {};


    this.wsServer.on('connection', this.connectionCb.bind(this, connectionCb));
  }


  connectionCb(connectionCb, socket, { user: { id: userId } }) {
    try {
      // eslint-disable-next-line no-param-reassign
      socket.isAlive = true;
      const oldSocket = this.userIdSocketMap[userId];
      if (oldSocket) {
        console.log('logout');
        this.send(userId, 'LOG_OUT');
        oldSocket.terminate();
      }
      setTimeout(() => {
        this.userIdSocketMap[userId] = socket;
        socket.on('message', this.messageCb.bind(this, socket));
        socket.on('close', this.closeCb.bind(this, socket, userId));
        this.send(userId, 'READY');
        connectionCb.call(this, { userId });
      }, 1000);
    } catch (error) {
      console.log(error);
    }
  }

  messageCb(socket, message) {
    const { type, payload } = JSON.parse(message);

    if (this.messageEventMap[type]) {
      this.messageEventMap[type](payload);
    }
  }

  closeCb(socket, userId) {
    console.log('deleted');
    delete this.userIdSocketMap[userId];
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

  send(userIds, type, payload = {}) {
    let userIdsArr;

    if (userIds === '*') {
      userIdsArr = Object.keys(this.userIdSocketMap);
    } else if (!Array.isArray(userIds)) {
      userIdsArr = [userIds];
    } else {
      userIdsArr = userIds;
    }

    userIdsArr.forEach((userId) => {
      const socket = this.userIdSocketMap[userId];
      if (socket) {
        socket.send(JSON.stringify({ type, payload }), (err) => {
          if (err) {
            console.error(err);
          }
        });
      }
    });
    console.log(`sent ${type} to userIds ${JSON.stringify(userIdsArr)} with payload ${JSON.stringify(payload).substr(0, 10000)} `);
  }
}
