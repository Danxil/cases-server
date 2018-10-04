import _ from 'lodash';
import { AES } from 'crypto-js';
import moment from 'moment';
import {
  GAME_USER_TIMEOUT,
  GAME_MIN_ALIVE_GAMES_AMOUNT,
  GAME_CHECK_DELLAY,
  LOW_LEVEL_GAME_PRIZE_TRESHOLD,
  LOW_LEVEL_GAMES_MIN_AMOUNT,
} from '../gameConfig';


const debug = require('debug')('game');

export const findGame = async ({ gameId }) => {
  return global.db.Game.find({
    where: { id: gameId },
    include: [
      { model: global.db.User, as: 'creatorUser' },
      { model: global.db.User, as: 'connectedUser' },
    ],
  });
};
export const getNotExpiredGames = async () => {
  return global.db.Game.findAll({
    include: [
      { model: global.db.User, as: 'creatorUser' },
      { model: global.db.User, as: 'connectedUser' },
    ],
  });
};
export const convertGameToJson = (game) => {
  return _.omit({
    ...game.toJSON(),
    connectedUser: game.connectedUser ? game.connectedUser.toJSON() : null,
    creatorUser: game.creatorUser ? game.creatorUser.toJSON() : null,
    schema: AES.encrypt(game.schema, 'dAfg$1397642gsge_39').toString(),
  }, []);
};
export const checkAndDisconnectConnectedGameUser = async ({ game }) => {
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
};

export const expireGame = async ({ game }) => {
  debug(`Game expired. gameId: ${game.id}`);
  await game.destroy({ force: true });
  if (game.isMaxAttemptsReached() || !game.creatorUserId) return null;
  const updatedCreatorUser = await game.creatorUser.update({
    balance: game.creatorUser.balance + (game.getLeftAttemptsAmount() * game.prize),
  });
  return { updatedCreatorUser, createdGame: null };
};

export const checkAndExpireNotExpiredGame = async ({ game }) => {
  if (game.isGameTimeoutReached()) {
    debug(`Game timeout reached. gamedId: ${game.id}`);
    await expireGame({ game });
    return { expiredGame: game };
  }

  if (game.spinInProgress) return {};
  if (
    game.isMaxAttemptsReached() &&
    moment(game.updatedAt).add(GAME_CHECK_DELLAY, 'ms').format() <= moment().format()
  ) {
    debug(`Max attempts reached. gamedId: ${game.id}`);
    const userToUpdate = await expireGame({ game });
    return { expiredGame: game, userToUpdate };
  }
  return {};
};

export const checkAndDisconnectConnectedGameUsers = async () => {
  const notExpiredGames = await getNotExpiredGames();
  const result = await Promise.all(
    notExpiredGames.map(game => checkAndDisconnectConnectedGameUser({ game })),
  );
  const gameUsersDisconnected = result.filter(o => o);
  return {
    gameUsersDisconnected,
  };
};

export const createGame = async ({ defaults = {} } = {}) => {
  const game = await global.db.Game.create(defaults);
  if (game.creatorUserId) {
    game.creatorUser = await game.getCreatorUser();
  }
  debug(`Game created. gameId: ${game.id}`);
  return game;
};

export const checkAndExpireNotExpiredGames = async () => {
  const notExpiredGames = await getNotExpiredGames();

  const results = await Promise.all(
    notExpiredGames.map(game => checkAndExpireNotExpiredGame({ game })),
  );

  const expiredGames = results.filter(o => o.expiredGame);
  const notifyUsersCreatorsIdsAboutGameExpired = expiredGames
  .map(o => o.expiredGame.creatorUserId)
  .filter(o => o);
  const expiredGamesIds = expiredGames.map(o => o.expiredGame.id);

  const usersToUpdate = results
  .filter(o => o.userToUpdate)
  .map(o => o.userToUpdate);

  const newNotExpiredGames = notExpiredGames
  .filter(notExpiredGame => !expiredGamesIds.find(id => notExpiredGame.id === id));
  const lowLevelGames = newNotExpiredGames
  .filter(notExpiredGame => notExpiredGame.prize <= LOW_LEVEL_GAME_PRIZE_TRESHOLD);

  const regularGamesToCreateAmount = GAME_MIN_ALIVE_GAMES_AMOUNT - newNotExpiredGames.length;
  const lowLevelGamesToCreateAmount = LOW_LEVEL_GAMES_MIN_AMOUNT - lowLevelGames.length;

  const regularGamesToCreateArr = new Array(
    regularGamesToCreateAmount >= 0 ? regularGamesToCreateAmount : 0,
  ).fill();
  const lowLevelGamesToCreateArr = new Array(
    lowLevelGamesToCreateAmount >= 0 ? lowLevelGamesToCreateAmount : 0,
  ).fill();
  const createdRegularGames = await Promise.all(regularGamesToCreateArr.map(() => createGame()));
  const createdLowLevelGames = await Promise.all(
    lowLevelGamesToCreateArr
    .map(() => createGame({ defaults: { prize: _.random(1, LOW_LEVEL_GAME_PRIZE_TRESHOLD) } })),
  );
  return {
    expiredGamesIds,
    notifyUsersCreatorsIdsAboutGameExpired,
    createdGames: [...createdRegularGames, ...createdLowLevelGames],
    usersToUpdate,
  };
};

export const getGame = async ({ game, gameId }) => {
  let targetGame;
  if (!game) targetGame = await global.db.Game.find({ where: { id: gameId } });
  else targetGame = game;
  return targetGame;
};

export const checkBeforeGameAction = async ({ user, gameId, game: gameToUse }) => {
  const game = await getGame({ gameId, game: gameToUse });
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
};

export const getInitData = async () => {
  const games = await getNotExpiredGames();
  return { games };
};
