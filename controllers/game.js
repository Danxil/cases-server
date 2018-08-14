import autoBind from 'auto-bind';
import moment from 'moment';
import {
  generateBot,
} from './fakes';
import { GAME_USER_TIMEOUT, GAME_MIN_ALIVE_GAMES_AMOUNT, GAME_CHECK_DELLAY } from '../gameConfig';

const debug = require('debug')('game');

export default class GameCtrl {
  constructor({ db }) {
    autoBind(this);
    this.db = db;
  }

  async findGame({ gameId }) {
    return this.db.Game.find({
      where: { id: gameId },
      include: [
        { model: this.db.User, as: 'creatorUser' },
        { model: this.db.User, as: 'connectedUser' },
      ],
    });
  }
  getNotExpiredGames() {
    return this.db.Game.findAll({
      include: [
        { model: this.db.User, as: 'creatorUser' },
        { model: this.db.User, as: 'connectedUser' },
      ],
    });
  }
  convertGameToJson(game) {
    return {
      ...game.toJSON(),
      connectedUser: game.connectedUser ? game.connectedUser.toJSON() : null,
      creatorUser: game.creatorUser ? game.creatorUser.toJSON() : null,
    };
  }
  async checkAndDisconnectConnectedGameUser({ game }) {
    if (!game.lastTouchAt || game.spinInProgress) return null;
    const expireTime = moment(game.lastTouchAt).add(GAME_USER_TIMEOUT).format();
    const now = moment(new Date()).format();
    if (expireTime > now) return null;
    debug(`Game user disconnected. gamedId: ${game.id}, userId: ${game.connectedUserId}`);
    const { connectedUserId, id: gameId } = game;
    await game.update({ lastTouchAt: null, connectedUserId: null });
    const obj = {
      gameId,
      userId: connectedUserId,
    };
    return obj;
  }

  async checkAndExpireNotExpiredGame({ game }) {
    if (game.isGameTimeoutReached()) {
      debug(`Game timeout reached. gamedId: ${game.id}`);
      await this.expireGame({ game });
      return { expiredGame: game };
    }

    if (game.spinInProgress) return {};
    if (
      game.isMaxAttemptsReached() &&
      moment(game.updatedAt).add(GAME_CHECK_DELLAY, 'ms').format() <= moment().format()
    ) {
      debug(`Max attempts reached. gamedId: ${game.id}`);
      const userToUpdate = await this.expireGame({ game });
      return { expiredGame: game, userToUpdate };
    }
    return {};
  }

  async checkAndDisconnectConnectedGameUsers() {
    const notExpiredGames = await this.getNotExpiredGames();
    const result = await Promise.all(
      notExpiredGames.map(game => this.checkAndDisconnectConnectedGameUser({ game })),
    );
    const gameUsersDisconnected = result.filter(o => o);
    return {
      gameUsersDisconnected,
    };
  }

  async checkAndExpireNotExpiredGames() {
    const notExpiredGames = await this.getNotExpiredGames();

    const results = await Promise.all(
      notExpiredGames.map(game => this.checkAndExpireNotExpiredGame({ game })),
    );

    const expiredGames = results.filter(o => o.expiredGame);
    const notifyUsersCreatorsIdsAboutGameExpired = expiredGames
    .map(o => o.expiredGame.creatorUserId)
    .filter(o => o);
    const expiredGamesIds = expiredGames.map(o => o.expiredGame.id);

    const gamesToCreateAmount = GAME_MIN_ALIVE_GAMES_AMOUNT -
    (notExpiredGames.length -
    expiredGamesIds.length);

    const usersToUpdate = results
    .filter(o => o.userToUpdate)
    .map(o => o.userToUpdate);

    const arr = new Array(gamesToCreateAmount >= 0 ? gamesToCreateAmount : 0).fill();
    const createdGames = await Promise.all(arr.map(() => this.createGame()));
    return {
      expiredGamesIds,
      notifyUsersCreatorsIdsAboutGameExpired,
      createdGames,
      usersToUpdate,
    };
  }

  async getGame({ game, gameId }) {
    let targetGame;
    if (!game) targetGame = await this.db.Game.find({ where: { id: gameId } });
    else targetGame = game;
    return targetGame;
  }

  async checkBeforeGameAction({ user, gameId, game: gameToUse }) {
    const game = await this.getGame({ gameId, game: gameToUse });
    if (!game) return false;
    if (game.risk > user.balance) {
      debug(`Game action impossible. Low balance. gameId: ${game.id}, userId: ${user.id}`);
      return false;
    }

    if (game.spinInProgress) {
      debug(`Game action impossible. Game spin already in progress. gameId ${game.id}, userId: ${user.id}`);
      return false;
    }
    if (game.isMaxAttemptsReached()) {
      debug(`Game action impossible. Max attempts is reached. gameId: ${game.id}, userId: ${user.id}`);
      return false;
    }
    return true;
  }

  async getInitData() {
    const games = await this.getNotExpiredGames();
    return { games };
  }

  async expireGame({ game }) {
    debug(`Game expired. gameId: ${game.id}`);
    if (game.creatorUser && game.creatorUser.bot) {
      await game.creatorUser.destroy();
    }
    await game.destroy({ force: true });
    if (game.isMaxAttemptsReached() || !game.creatorUserId) return null;
    const updatedCreatorUser = await game.creatorUser.update({
      balance: game.creatorUser.balance + (game.getLeftAttemptsAmount() * game.prize),
    });
    return updatedCreatorUser;
  }

  async createGame({ defaults = {} } = {}) {
    const game = await this.db.Game.create(defaults);
    if (game.creatorUserId) {
      game.creatorUser = await game.getCreatorUser();
    }
    debug(`Game created. gameId: ${game.id}`);
    return game;
  }
}
