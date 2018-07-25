import autoBind from 'auto-bind';
import _ from 'lodash';
import moment from 'moment';

import {
  GAME_EXPIRED,
  GAME_USER_DISCONNECTED,
  GAME_CREATED,
  NOTIFICATION_GAME_SPIN,
} from '../actionsTypes';

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
    const isGameExpired = await this.isGameExpired(game);
    const isMaxGameAttemptsReached = await this.isMaxGameAttemptsReached({ game });
    if (isGameExpired || isMaxGameAttemptsReached) {
      await this.expireGame(game);
      return false;
    }
    return true;
  }

  async checkConnectedGameUser(game) {
    const { GAME_USER_TIMEOUT, GAME_GAME_SPIN_DELAY } = process.env;
    const lastGameUserAction = await this.getLastGameUserAction(game);
    if (
      !lastGameUserAction ||
      lastGameUserAction.type === GAME_USER_DISCONNECTED
    ) return true;

    const add = lastGameUserAction.type !== NOTIFICATION_GAME_SPIN ?
    GAME_USER_TIMEOUT :
    GAME_USER_TIMEOUT + GAME_GAME_SPIN_DELAY;
    const expireTime = moment(lastGameUserAction.createdAt).add(add).format();
    const now = moment(new Date()).format();
    const isValid = expireTime > now;

    if (isValid) return true;
    await this.createGameAction({
      gameId: game.id,
      userId: lastGameUserAction.userId,
      type: GAME_USER_DISCONNECTED,
    });
    return false;
  }

  async isMaxGameAttemptsReached({ game, gameId }) {
    let targetGame;
    if (!game) targetGame = await this.db.Game.find({ where: { id: gameId } });
    else targetGame = game;
    const spinActions = await this.db.GameAction.findAll({
      where: {
        type: NOTIFICATION_GAME_SPIN,
        gameId: targetGame.id,
      },
    });
    return spinActions.length >= game.maxAttempts;
  }

  async isGameExpired(game) {
    const lastGameUserAction = await this.getLastGameUserAction(game);
    let from;
    if (!lastGameUserAction) {
      from = game.createdAt;
    } else if (lastGameUserAction.type === GAME_USER_DISCONNECTED) {
      from = lastGameUserAction.createdAt;
    } else {
      return false;
    }
    const now = moment(new Date()).format();
    const expire = moment(from).add(process.env.GAME_GAME_TIMEOUT, 'ms').format();
    return now >= expire;
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

  async isBalanceEnough({ user, game }) {
    return game.risk < user.balance;
  }

  async checkBeforeGameSpin({ user, gameId }) {
    const game = await this.db.Game.find({
      where: { id: gameId },
      include: {
        model: this.db.GameAction,
        where: { type: NOTIFICATION_GAME_SPIN },
        required: false,
      },
    });
    const isBalanceEnough = await this.isBalanceEnough({ user, game });
    const isMaxGameAttemptsReached = await this.isMaxGameAttemptsReached({ game });
    if (!isBalanceEnough) console.log(`Low balance for spin gameId: ${gameId}, userId: ${user.id}`);
    if (isMaxGameAttemptsReached) console.log(`Max attempts is reached: ${gameId}, userId: ${user.id}`);
    return isBalanceEnough && !isMaxGameAttemptsReached;
  }

  async expireGame(game) {
    await game.update({ expired: true });
    this.ws.send('*', GAME_EXPIRED, { gameId: game.id });
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
    send = true,
  }) {
    const game = await this.db.Game.findOne({
      where: { id: gameId },
    });
    const isGameNotExpired = await this.checkNotExpiredGame(game);
    if (!isGameNotExpired) {
      console.log(`This game already expired. GameId: ${gameId} `);
      return null;
    }
    const gameAction = await this.db.GameAction.create({
      type,
      payload: { gameId, userId, ...payload },
      gameId,
      userId,
    });
    if (send) this.ws.send('*', type, { userId, gameId, ...payload });
    return gameAction;
  }

  async sendInitData({ id }) {
    const aliveGames = await this.getNotExpiredGames();
    const gamesActions = [].concat
    .apply([], aliveGames.map(({ gameActions }) => {
      return [
        ..._.sortBy(gameActions, 'createdAt')
        .map(({ type, payload }) => ({ type, payload })),
      ];
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
