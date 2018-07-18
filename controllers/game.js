import gameConfig from '../game-config';

export default class GameCtrl {
  constructor(db, ws) {
    this.db = db;
    this.ws = ws;
  }

  async addUserAction({ userId, gameId, action }) {
    const gameUser = await this.db.GameUser.find({ where: { userId, gameId, isBot: false } });
    if (!gameUser) {
      throw new Error('This GameUser is not allowed for this game');
    }
    const gameAction = await this.addAction({
      action,
      gameId,
      userId,
      gameUserId: gameUser.id,
    });

    return gameAction;
  }

  async addAction({
    gameId,
    // userId,
    gameUserId,
    action,
  }) {
    const game = await this.db.Game.find({
      where: { id: gameId },
      include: [this.db.GameUser],
    });

    if (game.residueTime <= 0) {
      throw new Error('This Game is finished');
    }

    const gameAction = await this.db.GameAction.create({
      action,
      gameId,
      gameUserId,
    });

    const userIds = game.gameUsers.map((gameUser) => {
      return gameUser.userId;
    });

    // const userIdsWithoutCurrentUser = userIds.filter((item) => {
    //   return item !== userId;
    // });

    this.ws.send(userIds, 'GAME_ACTION_ADDED', gameAction);

    return gameAction;
  }

  async create() {
    const game = await this.db.Game.create();

    return game;
  }

  async findWithMinEstimators({ finderUserId }) {
    const games = await this.db.Game.findAll({ include: [this.db.GameUser, this.db.GameAction] });
    const filteredGames = games.filter((game) => {
      return !game.gameUsers.find((gameUser) => {
        return !gameUser.isBot && gameUser.userId === finderUserId;
      }) &&
      game.residueTime > gameConfig.RESIDUE_TIME_TRESHOLD_FOR_GAME_SEARCH &&
      game.gameActions.length;
    });

    return filteredGames.sort((a, b) => {
      return a.gameUsers.length - b.gameUsers.length;
    })[0];
  }
}
