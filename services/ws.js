import WebSocket from 'ws';
import passport from 'passport';
import autoBind from 'auto-bind';

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
    autoBind(this);
    this.wsServer = new WebSocket.Server(WS.getWsServerConfig({ server, sessionParser }));
    this.db = db;
    this.callbacks = {};
    this.userIdSocketMap = {};

    this.wsServer.on('connection', this.connectionCb);

    return this;
  }


  async connectionCb(socket, { user }) {
    try {
      const oldSocket = this.userIdSocketMap[user.id];
      if (oldSocket) {
        console.log('logout');
        this.send(user.id, 'LOG_OUT');
        oldSocket.terminate();
      }
    } catch (error) {
      console.log(error);
      return;
    }
    setTimeout(async () => {
      try {
        this.userIdSocketMap[user.id] = socket;
        socket.on('message', this.messageCb.bind(this, user));
        socket.on('close', this.closeCb.bind(this, user));
        this.send(user.id, 'READY');
        if (this.callbacks.onConnection) await this.callbacks.onConnection(user);
      } catch (error) {
        console.log(error);
      }
    }, 1000);
  }

  async messageCb(user, message) {
    try {
      const { type, payload } = JSON.parse(message);
      console.log(`recieved ${type} from userId ${user.id} with payload ${JSON.stringify(payload).substr(0, 10000)}`);
      if (this.callbacks.onMessage) await this.callbacks.onMessage(user, { type, payload });
    } catch (e) {
      console.log(e);
    }
  }

  async closeCb(user) {
    try {
      console.log('deleted');
      delete this.userIdSocketMap[user.id];
      if (this.callbacks.onClose) await this.callbacks.onClose(user);
    } catch (e) {
      console.log(e);
    }
  }

  on(action, cb) {
    this.callbacks[`on${action.charAt(0).toUpperCase() + action.slice(1)}`] = cb;
    return this;
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
