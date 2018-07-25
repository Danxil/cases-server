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
  getNotExpiredGames() {
    return this.db.Game.findAll({
      where: { expired: false },
      include: { model: this.db.GameAction },
    });
  }

  async checkNotExpiredGame({ game }) {
    await this.checkConnectedGameUser({ game });

    const isGameExpired = await this.isGameExpired({ game });
    if (isGameExpired) {
      console.log(`Game expired. gamdId: ${game.id}`);
      await this.expireGame({ game });
      return false;
    }
    const isGameSpinInProgress = await this.isGameSpinInProgress({ game });
    if (isGameSpinInProgress) return true;

    const isMaxGameAttemptsReached = await this.isMaxGameAttemptsReached({ game });
    if (isMaxGameAttemptsReached) {
      console.log(`Max attempts reached. gamdId: ${game.id}`);
      await this.expireGame({ game });
      return false;
    }
    return true;
  }

  async checkNotExpiredGames() {
    const notExpiredGames = await this.getNotExpiredGames();
    const results = await Promise.all(
      notExpiredGames.map(game => this.checkNotExpiredGame({ game })),
    );
    const aliveGames = results.filter(result => result);
    const gamesToCreateAmount = process.env.GAME_MIN_ALIVE_GAMES_AMOUNT - aliveGames.length;

    if (gamesToCreateAmount > 0) {
      const arr = Array.from(Array(gamesToCreateAmount).keys());
      await Promise.all(arr.map(() => this.createGame()));
    }
  }

  async checkConnectedGameUser({ game }) {
    const { GAME_USER_TIMEOUT } = process.env;
    const lastGameUserAction = await this.getLastGameUserAction({ game });
    if (
      !lastGameUserAction ||
      lastGameUserAction.type === GAME_USER_DISCONNECTED ||
      lastGameUserAction.type === NOTIFICATION_GAME_SPIN
    ) return true;

    const expireTime = moment(lastGameUserAction.createdAt).add(GAME_USER_TIMEOUT).format();
    const now = moment(new Date()).format();

    if (expireTime > now) return true;

    await this.createGameAction({
      gameId: game.id,
      userId: lastGameUserAction.userId,
      type: GAME_USER_DISCONNECTED,
    });
    return false;
  }

  async isGameSpinInProgress({ game }) {
    const lastGameUserAction = await this.getLastGameUserAction({ game });
    return lastGameUserAction && lastGameUserAction.type === NOTIFICATION_GAME_SPIN;
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

  async isGameExpired({ game }) {
    const lastGameUserAction = await this.getLastGameUserAction({ game });
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

  async isGameInProgress({ gameId }) {
    const lastGameUserAction = await this.getLastGameUserAction({ gameId });
    return lastGameUserAction && lastGameUserAction.type !== GAME_USER_DISCONNECTED;
  }

  async isBalanceEnough({ user, game }) {
    return this.db.Game.getRisk(game) < user.balance;
  }

  async getLastGameUserAction({ gameId, game }) {
    let result;
    if (gameId) {
      result = await this.db.GameAction.findAll({
        where: {
          gameId,
        },
        limit: 1,
        order: [['createdAt', 'DESC']],
      });
    } else if (game) {
      result = _.sortBy(game.gameActions, 'createdAt').reverse();
    }
    return result[0];
  }

  async checkBeforeNotificationGameSpin({ user, gameId }) {
    const game = await this.db.Game.find({
      where: { id: gameId },
      include: {
        model: this.db.GameAction,
      },
    });
    const isBalanceEnough = await this.isBalanceEnough({ user, game });
    if (!isBalanceEnough) {
      console.log(`Low balance for spin gameId: ${gameId}, userId: ${user.id}`);
      return false;
    }

    const isGameSpinInProgress = await this.isGameSpinInProgress({ game });
    if (isGameSpinInProgress) {
      console.log(`Game spin already in progress: ${gameId}, userId: ${user.id}`);
      return false;
    }

    const isMaxGameAttemptsReached = await this.isMaxGameAttemptsReached({ game });
    if (isMaxGameAttemptsReached) {
      console.log(`Max attempts is reached: ${gameId}, userId: ${user.id}`);
      return false;
    }
    return true;
  }

  async createGameAction({
    gameId,
    userId,
    type,
    payload = {},
    send = true,
  }) {
    const game = await this.db.Game.findOne({ where: { id: gameId } });
    if (game.expired) return null;

    const gameAction = await this.db.GameAction.create({
      type,
      payload: { gameId, userId, ...payload },
      gameId,
      userId,
    });
    const user = await gameAction.getUser();
    if (send) this.ws.send('*', type, { userId, gameId, user: user.toJSON(), ...payload });
    return gameAction;
  }

  async sendInitData({ user: { id } }) {
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

  async expireGame({ game }) {
    await game.update({ expired: true });
    this.ws.send('*', GAME_EXPIRED, { gameId: game.id });
  }

  async createGame({ defaults = {}, creatorUser } = {}) {
    if (creatorUser) {
      const isBalanceEnough = this.isBalanceEnough({ game: defaults, user: creatorUser });
      if (!isBalanceEnough) return;
      defaults.creatorUserId = creatorUser.id;
    }
    const game = await this.db.Game.create(defaults);
    let jsonGame = game.toJSON();
    if (creatorUser) jsonGame = { ...jsonGame, creatorUser };
    this.ws.send('*', GAME_CREATED, { game: jsonGame });
  }
}
