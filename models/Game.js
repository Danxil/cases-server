import Sequelize from 'sequelize';
import _ from 'lodash';

const {
  GAME_MIN_CHANCE_TO_WIN,
  GAME_MAX_CHANCE_TO_WIN,
  GAME_MAX_ATTEMPTS,
  GAME_MIN_PRIZE,
  GAME_MAX_PRIZE,
} = process.env;

export default (sequelize) => {
  const Game = sequelize.define('Game', {
    prize: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    chanceToWin: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    maxAttempts: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    risk: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    expired: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  }, {
    name: {
      singular: 'game',
      plural: 'games',
    },
  });

  Game.associate = (models) => {
    models.Game.hasMany(models.GameAction, { foreignKey: 'gameId' });
    models.Game.belongsTo(models.User, { foreignKey: 'creatorUserId' });
  };

  Game.getRisk = ({ prize, chanceToWin }) => (prize * chanceToWin) / (100 - chanceToWin);

  Game.beforeValidate((game) => {
    /* eslint-disable no-param-reassign */
    if (!game.chanceToWin) {
      game.chanceToWin = _.random(GAME_MIN_CHANCE_TO_WIN, GAME_MAX_CHANCE_TO_WIN);
    }
    if (!game.maxAttempts) {
      game.maxAttempts = _.random(1, GAME_MAX_ATTEMPTS);
    }
    if (!game.prize) {
      game.prize = _.random(GAME_MIN_PRIZE, GAME_MAX_PRIZE);
    }
    game.risk = Game.getRisk(game);
    /* eslint-disable no-param-reassign */
  });

  return Game;
};
