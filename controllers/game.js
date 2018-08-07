import autoBind from 'auto-bind';
import _ from 'lodash';
import moment from 'moment';
import { getRisk } from '../helpers/gameUtils';
import {
  getRandomPlaygroundBot,
} from '../helpers/fakesUtils';
import { GAME_USER_TIMEOUT, GAME_GAME_TIMEOUT, GAME_MIN_ALIVE_GAMES_AMOUNT, GAME_GAME_SPIN_DELAY } from '../gameConfig';

export default class GameCtrl {
  constructor({ db, userCtrl }) {
    autoBind(this);
    this.db = db;
    this.userCtrl = userCtrl;
  }
  getNotExpiredGames() {
    return this.db.Game.findAll({
      where: { expired: false },
      include: [this.db.GameAction, { model: this.db.User, as: 'creatorUser' }],
    });
  }

  async checkAndDisconnectConnectedGameUser({ game }) {
    const lastGameUserAction = await this.getLastGameUserAction({ game });
    if (
      !lastGameUserAction ||
      lastGameUserAction.type === 'GAME_USER_DISCONNECTED'
    ) return null;

    const add = lastGameUserAction.type === 'GAME_SPIN_START' ?
    GAME_GAME_SPIN_DELAY * 2 :
    GAME_USER_TIMEOUT;

    const expireTime = moment(lastGameUserAction.createdAt).add(add).format();
    const now = moment(new Date()).format();

    if (expireTime > now) return null;
    // console.log(`Game user disconnected. gamedId: ${game.id}, userId: ${lastGameUserAction.userId}`);
    const gameAction = await this.createGameAction({
      gameId: game.id,
      userId: lastGameUserAction.userId,
      type: 'GAME_USER_DISCONNECTED',
      send: false,
    });
    return gameAction;
  }

  async checkAndExpireNotExpiredGame({ game }) {
    // const isGameTimeoutReached = await this.isGameTimeoutReached({ game });
    // if (isGameTimeoutReached) {
    //   console.log(`Game timeout reached. gamedId: ${game.id}`);
    //   const userToUpdate = await this.expireGame({ game });
    //   return { expiredGame: game, userToUpdate };
    // }
    const isGameSpinInProgress = await this.isGameSpinInProgress({ game });
    if (isGameSpinInProgress) return {};

    const isMaxGameAttemptsReached = await this.isMaxGameAttemptsReached({ game });
    if (isMaxGameAttemptsReached) {
      // console.log(`Max attempts reached. gamedId: ${game.id}`);
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
    const gameUserDisconnectGameActions = result.filter(o => o);
    return {
      gameUserDisconnectGameActions,
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

  async isGameSpinInProgress({ game }) {
    const lastGameUserAction = await this.getLastGameUserAction({ game });
    return lastGameUserAction && lastGameUserAction.type === 'GAME_SPIN_START';
  }

  async getAttemptsAmount({ gameId }) {
    const gameActions = await this.db.GameAction.findAll({
      where: {
        type: 'GAME_SPIN_START',
        gameId,
      },
    });
    return gameActions.length;
  }

  async isMaxGameAttemptsReached({ game, gameId }) {
    let targetGame;
    if (!game) targetGame = await this.db.Game.find({ where: { id: gameId } });
    else targetGame = game;
    const spinActionsAmount = await this.getAttemptsAmount({ gameId: targetGame.id });
    return spinActionsAmount >= game.maxAttempts;
  }

  async isGameTimeoutReached({ game }) {
    const lastGameUserAction = await this.getLastGameUserAction({ game });
    let from;
    if (!lastGameUserAction) {
      from = game.createdAt;
    } else if (lastGameUserAction.type === 'GAME_USER_DISCONNECTED') {
      from = lastGameUserAction.createdAt;
    } else {
      return false;
    }
    const now = moment(new Date()).format();
    const expire = moment(from).add(GAME_GAME_TIMEOUT, 'ms').format();
    return now >= expire;
  }

  async isGameInProgress({ gameId, game }) {
    const lastGameUserAction = await this.getLastGameUserAction({ gameId, game });
    return lastGameUserAction && lastGameUserAction.type !== 'GAME_USER_DISCONNECTED';
  }

  async isBalanceEnough({ user, game }) {
    return getRisk(game) < user.balance;
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

  async checkBeforeNotificationGameSpin({ user, gameId, game: gameToUse }) {
    let game;
    if (gameToUse) {
      game = gameToUse;
    } else {
      game = await this.db.Game.find({
        where: { id: gameId },
        include: {
          model: this.db.GameAction,
        },
      });
    }
    const isBalanceEnough = await this.isBalanceEnough({ user, game });
    if (!isBalanceEnough) {
      // console.log(`Game spin impossible. Low balance. gameId: ${game.id}, userId: ${user.id}`);
      return false;
    }

    const isGameSpinInProgress = await this.isGameSpinInProgress({ game });
    if (isGameSpinInProgress) {
      // console.log(`Game spin impossible. Game spin already in progress. gameId ${game.id}, userId: ${user.id}`);
      return false;
    }

    const isMaxGameAttemptsReached = await this.isMaxGameAttemptsReached({ game });
    if (isMaxGameAttemptsReached) {
      // console.log(`Game spin impossible. Max attempts is reached. gameId: ${game.id}, userId: ${user.id}`);
      return false;
    }
    return true;
  }

  async createGameAction({
    gameId,
    userId,
    game: gameToUse,
    type,
    payload = {},
  }) {
    let game;
    if (gameToUse) game = gameToUse;
    else game = await this.db.Game.findOne({ where: { id: gameId } });

    if (!game || game.expired) {
      // console.log(`GameAction not created. Game already expired. gameId: ${game.id}, userId: ${userId}, gameActionType: ${type}`);
      return null;
    }

    const gameAction = await this.db.GameAction.create({
      type,
      payload: { gameId: game.id, userId, ...payload },
      gameId: game.id,
      userId,
    });
    // console.log(`GameAction created. gameId: ${game.id}, userId: ${userId}, gameActionType: ${type}`);
    return gameAction;
  }

  async getInitData() {
    const aliveGames = await this.getNotExpiredGames();
    const gamesActions = [].concat
    .apply([], aliveGames.map(({ gameActions }) => {
      return [
        ..._.sortBy(gameActions, 'createdAt'),
      ];
    }));

    const games = aliveGames.map((game) => {
      const jsonGame = game.toJSON();
      delete jsonGame.gameActions;
      return jsonGame;
    });

    const users = await Promise.all(gamesActions.map(gamesAction => gamesAction.getUser()));
    const actions = gamesActions.map((gamesAction, index) => ({
      type: gamesAction.type,
      payload: {
        ...gamesAction.payload,
        user: users[index],
      },
    }));
    return { games, actions };
  }

  async expireGame({ game }) {
    // console.log(`Game expired. gameId: ${game.id}`);
    await Promise.all(game.gameActions.map(o => o.destroy({ force: true })));
    await game.destroy({ force: true });
    const attemptsAmount = await this.getAttemptsAmount({ gameId: game.id });
    const attemptsLeft = game.maxAttempts - attemptsAmount;
    if (attemptsLeft <= 0 || !game.creatorUser) return null;
    const updatedCreatorUser = await game.creatorUser.update({
      balance: game.creatorUser.balance + (attemptsLeft * game.prize),
    });

    return updatedCreatorUser;
  }

  async createGame({ defaults = {} } = {}) {
    let user;
    if (!defaults.creatorUserId) {
      user = await this.userCtrl.createBot();
      const bot = getRandomPlaygroundBot();
      if (bot) {
        user.photo = bot.photo;
        user.displayName = bot.displayName;
      }
      defaults.creatorUserId = user.id;
    }
    const game = await this.db.Game.create(defaults);
    game.creatorUser = user;
    // console.log(`Game created. gameId: ${game.id}`);
    return game;
  }

  async findGame({ gameId }) {
    return this.db.Game.find({
      where: { id: gameId },
      include: [this.db.GameAction, { model: this.db.User, as: 'creatorUser' }],
    });
  }
}
