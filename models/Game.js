import Sequelize from 'sequelize';
import _ from 'lodash';
import AES from 'crypto-js/aes';
import { getRisk } from '../helpers/gameUtils';
import {
  GAME_MIN_CHANCE_TO_WIN,
  GAME_MAX_CHANCE_TO_WIN,
  GAME_MAX_ATTEMPTS,
  GAME_MIN_PRIZE,
  GAME_MAX_PRIZE,
} from '../gameConfig';

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
    schema: {
      type: Sequelize.STRING,
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
    models.Game.belongsTo(models.User, { foreignKey: 'creatorUserId', as: 'creatorUser' });
  };

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
    game.risk = getRisk(game);
    const coeficient = (100 - game.chanceToWin) / 100;
    const lengthLooseItems = Math.ceil(game.maxAttempts * coeficient);
    const schema = _.shuffle([].concat(
      new Array(lengthLooseItems).fill(0),
      new Array(game.maxAttempts - lengthLooseItems).fill(1),
    )).join('');
    game.schema = AES.encrypt(schema, 'dAfg$1397642gsge_39').toString();
    /* eslint-disable no-param-reassign */
  });

  return Game;
};
