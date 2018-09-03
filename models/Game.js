import Sequelize from 'sequelize';
import _ from 'lodash';
import moment from 'moment';
import AES from 'crypto-js/aes';
import { getRisk } from '../helpers/gameUtils';
import {
  GAME_MIN_CHANCE_TO_WIN,
  GAME_MAX_CHANCE_TO_WIN,
  GAME_MAX_ATTEMPTS,
  GAME_SPIN_DELAY,
  GAME_MIN_PRIZE,
  GAME_MAX_PRIZE,
} from '../gameConfig';

require('dotenv').config();

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
    won: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lost: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    risk: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    spinInProgress: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    schema: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    decryptedSchema: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    lastTouchAt: {
      type: Sequelize.DATE,
    },
  }, {
    name: {
      singular: 'game',
      plural: 'games',
    },
  });

  Game.prototype.isMaxAttemptsReached = function () {
    return this.won + this.lost >= this.maxAttempts;
  };
  Game.prototype.isGameTimeoutReached = function () {
    if (!this.spinInProgress) return false;
    const now = moment(new Date()).format();
    const expire = moment(this.lastTouchAt).add(GAME_SPIN_DELAY * 2, 'ms').format();
    return now >= expire;
  };

  Game.prototype.getAttemptsAmount = function () {
    return this.won + this.lost;
  };
  Game.prototype.getLeftAttemptsAmount = function () {
    return this.maxAttempts - (this.won + this.lost);
  };

  Game.associate = (models) => {
    models.Game.belongsTo(models.User, { foreignKey: 'creatorUserId', as: 'creatorUser' });
    models.Game.belongsTo(models.User, { foreignKey: 'connectedUserId', as: 'connectedUser' });
  };

  Game.beforeValidate((game) => {
    /* eslint-disable no-param-reassign */
    if (!game.chanceToWin) {
      game.chanceToWin = _.random(GAME_MIN_CHANCE_TO_WIN, GAME_MAX_CHANCE_TO_WIN);
    }
    if (!game.maxAttempts) {
      // game.maxAttempts = _.random(1, GAME_MAX_ATTEMPTS);
      game.maxAttempts = GAME_MAX_ATTEMPTS;
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
    game.decryptedSchema = schema;
    game.schema = AES.encrypt(schema, 'dAfg$1397642gsge_39').toString();
    /* eslint-enable no-param-reassign */
  });

  return Game;
};
