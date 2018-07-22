import Sequelize from 'sequelize';
import autoBind from 'auto-bind';
import moment from 'moment';

import { GAME_EXPIRED, GAME_USER_DISCONNECTED, GAME_CREATED } from '../actionsTypes';

export default class GameCtrl {
  constructor({ db, ws }) {
    autoBind(this);
    this.db = db;
    this.ws = ws;
  }

  async checkNotExpiredGames() {
    try {
      const notExpiredGames = await this.getNotExpiredGames();
      const aliveGames = await Promise.all(notExpiredGames.map((game) => {
        return this.checkNotExpiredGame(game);
      }));
      for (
        let i = aliveGames.length;
        i < process.env.GAME_MIN_ALIVE_GAMES_AMOUNT;
        i += 1
      ) {
        this.createGame();
      }
    } catch (e) {
      console.log(e);
    }
  }

  async checkNotExpiredGame(game) {
    const isGameExpired = await this.isGameExpired(game);
    if (isGameExpired) return true;
    await this.expireGame(game);
    return false;
  }

  getNotExpiredGames() {
    return this.db.Game.findAll({
      where: { expired: false },
      include: { model: this.db.GameAction },
    });
  }

  async isGameExpired(game) {
    const result = await game.getGameActions({
      where: Sequelize.literal(`("GameAction"."action"->>'type') = '${GAME_USER_DISCONNECTED}'`),
      limit: 1,
      order: [['createdAt', 'DESC']],
    });
    let from;
    if (result.length) {
      from = result[0].createdAt;
    } else {
      from = game.createdAt;
    }

    const expired = moment(from)
    .add(process.env.GAME_GAME_TIMEOUT, 'ms')
    .format() >= moment(new Date()).format();
    return expired;
  }

  async expireGame(game) {
    await game.update({ expired: true });
    this.ws.send('*', GAME_EXPIRED, { id: game.id });
  }

  async createGame() {
    const game = await this.db.Game.create();
    this.ws.send('*', GAME_CREATED, game.toJSON());
  }

  async createGameAction({
    gameId,
    userId,
    type,
    payload,
  }) {
    const game = await this.db.Game.findOne({
      where: { id: gameId },
    });

    const checkResult = await this.checkNotExpiredGame(game);

    if (!checkResult) {
      throw new Error(`This game already expired. GameId: ${gameId} `);
    }

    const gameAction = await this.db.GameAction.create({
      action: { type, payload },
      gameId,
      userId,
    });

    this.ws.send('*', type, gameAction.toJSON());

    return gameAction;
  }

  async sendInitData({ userId }) {
    const aliveGames = await this.getNotExpiredGames();
    this.ws.send(userId, 'INIT_DATA', { games: aliveGames.map(game => game.toJSON()) });
  }
}
