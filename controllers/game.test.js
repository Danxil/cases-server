import db from '../services/db';
import GameCtrl from './game';
import { mockUser, mockGameUser, mockGame, mockTask, mockGameAction, mockWs } from '../mocks';

const gameCtrl = new GameCtrl(db, mockWs());

let users = [];
let gameUsers = [];
let gameActions = [];
const games = [];
let tasks = [];

beforeAll(async () => {
  users = [
    await db.User.create(mockUser()),
    await db.User.create(mockUser()),
    await db.User.create(mockUser()),
    await db.User.create(mockUser()),
    await db.User.create(mockUser()),
    await db.User.create(mockUser()),
    await db.User.create(mockUser()),
  ];

  games.push(await db.Game.create(mockGame()));
  games.push(await db.Game.create(mockGame()));

  gameUsers = [
    await db.GameUser.create(mockGameUser(users[0].id, games[0].id)),
    await db.GameUser.create(mockGameUser(users[1].id, games[0].id)),
    await db.GameUser.create(mockGameUser(users[2].id, games[0].id, true)),
    await db.GameUser.create(mockGameUser(users[3].id, games[0].id, true)),
    await db.GameUser.create(mockGameUser(users[4].id, games[0].id, true)),

    // game without estimators
    await db.GameUser.create(mockGameUser(users[5].id, games[1].id)),
    await db.GameUser.create(mockGameUser(users[6].id, games[1].id)),
  ];

  gameActions = [
    await db.GameAction.create(mockGameAction(gameUsers[0].id, games[0].id)),
    await db.GameAction.create(mockGameAction(gameUsers[1].id, games[0].id)),
    await db.GameAction.create(mockGameAction(gameUsers[2].id, games[0].id, {
      gameUserId: gameUsers[0].id,
    })),
    await db.GameAction.create(mockGameAction(gameUsers[3].id, games[0].id, {
      gameUserId: gameUsers[1].id,
    })),
    await db.GameAction.create(mockGameAction(gameUsers[4].id, games[0].id, {
      gameUserId: gameUsers[1].id,
    })),
    await db.GameAction.create(mockGameAction(gameUsers[4].id, games[0].id, {
      gameUserId: gameUsers[0].id,
    })),
    await db.GameAction.create(mockGameAction(gameUsers[4].id, games[0].id, {
      gameUserId: gameUsers[1].id,
    })),
  ];

  tasks = [
    await db.Task.create(mockTask()),
    await db.Task.create(mockTask()),
  ];
});

afterAll(async () => {
  await users.map((user) => {
    return user.destroy();
  });

  const allGameUsers = await db.GameUser.findAll();

  await Promise.all(allGameUsers.map((item) => {
    return item.destroy();
  }));

  const allGames = await db.Game.findAll();

  await Promise.all(allGames.map((item) => {
    return item.destroy();
  }));

  await tasks.map((task) => {
    return task.destroy();
  });

  await Promise.all(await gameActions.map((gameAction) => {
    return gameAction.destroy();
  }));
});

describe('game', () => {
  it('addUserAction', async () => {
    try {
      const userId = users[0].id;
      const gameUserId = gameUsers[0].id;
      const gameId = games[0].id;

      const result = await gameCtrl.addUserAction({
        userId,
        gameId,
        action: { someAction: 'someAction' },
        db,
      });

      gameActions.push(result);

      expect(result.gameId).toBe(gameId);
      expect(result.gameUserId).toBe(gameUserId);
      expect(result.action.someAction).toBe('someAction');
    } catch (err) {
      throw new Error(err.stack);
    }
  });

  it('create', async () => {
    try {
      const result = await gameCtrl.create({ db });
      games.push(result);

      expect(typeof result.id).toBe('number');
      expect(typeof result.taskId).toBe('number');
    } catch (err) {
      throw new Error(err.stack);
    }
  });

  it('getGameWinnerGameUserId', async () => {
    try {
      const result = await gameCtrl.getGameWinnerGameUserId({ game: games[0], db });

      expect(result).toBe(gameUsers[1].id);
    } catch (err) {
      throw new Error(err.stack);
    }
  });

  it('isEstimatorsPresent', async () => {
    try {
      expect(await gameCtrl.isEstimatorsPresent(games[0])).toBe(true);
      expect(await gameCtrl.isEstimatorsPresent(games[1])).toBe(false);
    } catch (err) {
      throw new Error(err.stack);
    }
  });

  it('gameActionsEmulator', async () => {
    try {
      const gameActionsPart = gameActions.slice(0, 2);

      const result = await gameCtrl.gameActionsEmulator({
        gameId: games[1].id,
        gameActions: gameActionsPart,
        db,
      });

      gameActions = gameActions.concat(result);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(gameActionsPart.length);
      expect(JSON.stringify(result[0].action)).toBe(JSON.stringify(gameActionsPart[0].action));
      expect(result[0].gameId).not.toBe(gameActionsPart[0].gameId);
    } catch (err) {
      throw new Error(err.stack);
    }
  });

  it('finishGame', async () => {
    try {
      const initWonUserGamesWon = users[1].gamesWon;
      const game = games[0];

      const result = await gameCtrl.finishGame({ game, db });

      expect(result.game.id).toBe(game.id);
      expect(result.users[0].id).toBe(users[0].id);
      expect(result.users[1].gamesWon).toBe(initWonUserGamesWon + 1);
    } catch (err) {
      throw new Error(err.stack);
    }
  });

  it('timeIntervalIteration', async () => {
    try {
      const gameId = games[0].id;

      const intervalId = setInterval(() => {});

      const result = await gameCtrl.timeIntervalIteration({ gameId, intervalId, db });

      expect(result).toBe(true);
    } catch (err) {
      throw new Error(err.stack);
    }
  });

  it('createBotForGame estimator', async () => {
    try {
      const game = games[0];

      const result = await gameCtrl.createBotForGame({ game, isEstimator: true });
      expect(result.isBot).toBe(true);
      expect(result.isEstimator).toBe(true);
    } catch (err) {
      throw new Error(err.stack);
    }
  });

  it('createBotForGame player', async () => {
    try {
      const game = games[0];

      await gameCtrl.createBotForGame({ game, isEstimator: false });
    } catch (err) {
      expect(err.message).toBe('GameUser with the same task is not found');
    }
  });
});
