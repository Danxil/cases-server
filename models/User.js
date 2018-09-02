import Sequelize from 'sequelize';
import _ from 'lodash';
import faker from 'faker';
import { START_USER_BALANCE } from '../gameConfig';

export default (sequelize) => {
  const User = sequelize.define('User', {
    twitterId: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    facebookId: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    instagramId: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    googleId: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    vkontakteId: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    password: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    experience: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    gamesTotal: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    gamesWon: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    gamesLose: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    gamesDraw: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    balance: {
      type: Sequelize.FLOAT,
      defaultValue: START_USER_BALANCE,
      allowNull: false,
    },
    paid: {
      type: Sequelize.FLOAT,
      defaultValue: 0,
      allowNull: false,
    },
    displayName: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    photo: {
      type: Sequelize.STRING,
    },
    bot: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    demoModeFinishedConfirmation: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  }, {
    name: {
      singular: 'user',
      plural: 'users',
    },
  });

  User.associate = (models) => {
    models.User.hasOne(models.Game, { foreignKey: 'creatorUserId', as: 'createdGame' });
  };

  User.beforeValidate(async (user) => {
    if (user.bot && !user.photo) {
      const card = faker.helpers.contextualCard();
      user.photo = card.avatar;
      user.displayName = `${card.name} ${faker.name.lastName()}`;
      user.balance = _.random(1000, 5000);
    }
  });

  User.prototype.verifyPassword = function (password) {
    return password === this.password;
  };

  return User;
};
