// import Sequelize, { Op } from 'sequelize';
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
    const notExpiredGames = await this.getNotExpiredGames();
    const results = await Promise.all(notExpiredGames.map(async (game) => {
      await this.checkConnectedGameUser(game);
      return this.checkNotExpiredGame(game);
    }));
    const aliveGames = results.filter(result => result);
    const gamesToCreateAmount = process.env.GAME_MIN_ALIVE_GAMES_AMOUNT - aliveGames.length;

    if (gamesToCreateAmount > 0) {
      const arr = Array.from(Array(gamesToCreateAmount).keys());
      await Promise.all(arr.map(() => this.createGame()));
    }
  }

  async checkNotExpiredGame(game) {
    const lastGameUserAction = await this.getLastGameUserAction(game);
    let from;
    if (!lastGameUserAction) {
      from = game.createdAt;
    } else if (lastGameUserAction.type === GAME_USER_DISCONNECTED) {
      from = lastGameUserAction.createdAt;
    } else {
      return true;
    }
    const isGameExpired = moment(new Date()).format() >= moment(from)
    .add(process.env.GAME_GAME_TIMEOUT, 'ms')
    .format();
    if (isGameExpired) {
      await this.expireGame(game);
      return false;
    }
    return true;
  }

  async checkConnectedGameUser(game) {
    const lastGameUserAction = await this.getLastGameUserAction(game);
    if (
      !lastGameUserAction ||
      lastGameUserAction.type === GAME_USER_DISCONNECTED
    ) return true;
    const isValid = moment(lastGameUserAction.createdAt)
    .add(process.env.GAME_USER_TIMEOUT).format() > moment(new Date()).format();
    if (isValid) return true;
    await this.createGameAction({
      gameId: game.id,
      userId: lastGameUserAction.userId,
      type: GAME_USER_DISCONNECTED,
    });
    return false;
  }

  getNotExpiredGames() {
    return this.db.Game.findAll({
      where: { expired: false },
      include: { model: this.db.GameAction },
    });
  }

  async getLastGameUserAction({ id: gameId }) {
    const result = await this.db.GameAction.findAll({
      where: {
        gameId,
      },
      limit: 1,
      order: [['createdAt', 'DESC']],
    });
    return result[0];
  }

  async isGameInProgress({ id }) {
    const lastGameUserAction = await this.getLastGameUserAction({ id });
    return lastGameUserAction && lastGameUserAction.type !== GAME_USER_DISCONNECTED;
  }

  async expireGame(game) {
    await game.update({ expired: true });
    this.ws.send('*', GAME_EXPIRED, { id: game.id });
  }

  async createGame() {
    const game = await this.db.Game.create();
    this.ws.send('*', GAME_CREATED, { game: game.toJSON() });
  }

  async createGameAction({
    gameId,
    userId,
    type,
    payload = {},
  }) {
    const game = await this.db.Game.findOne({
      where: { id: gameId },
    });
    const isGameNotExpired = await this.checkNotExpiredGame(game);
    if (!isGameNotExpired) {
      throw new Error(`This game already expired. GameId: ${gameId} `);
    }
    const gameAction = await this.db.GameAction.create({
      type,
      payload,
      gameId,
      userId,
    });
    this.ws.send('*', type, { userId, gameId, ...payload });
    return gameAction;
  }

  async sendInitData({ id }) {
    const aliveGames = await this.getNotExpiredGames();
    const gamesActions = [].concat
    .apply([], aliveGames.map(({ gameActions }) => {
      return [...gameActions.map(gameAction => gameAction.toJSON())];
    }));
    this.ws.send(id, 'INIT_DATA', {
      games: aliveGames.map((game) => {
        const jsonGame = game.toJSON();
        delete jsonGame.gameActions;
        return jsonGame;
      }),
      actions: gamesActions,
    });
  }
}
