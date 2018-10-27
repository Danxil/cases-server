import Sequelize from 'sequelize';
import faker from 'faker';
import _ from 'lodash';
import { MIN_AMOUNT_OF_WITHDRAWING, START_USER_BALANCE, START_BOT_BALANCE } from '../gameConfig';
import fakePersons from '../fakePersons';

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
      set(value) {
        if (value >= MIN_AMOUNT_OF_WITHDRAWING) {
          this.setDataValue('wasAbleToWithdraw', true);
        }
        this.setDataValue('balance', value);
      },
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
    demoModeActivatedConfirmation: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    isAdmin: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    wasAbleToWithdraw: {
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
    models.User.hasOne(models.Game, { foreignKey: 'connectedUserId', as: 'connectedGame' });
  };

  User.initData = async (db) => {
    const query = {
      isAdmin: true,
      email: 'admin@admin.admin',
      password: 'admin666',
    };
    await db.User.findOrCreate({ where: query, defaults: query });
  };

  User.beforeValidate(async (user) => {
    if (user.bot && !user.photo) {
      const card = _.sample(fakePersons.results);
      if (card.gender === 'male') {
        user.photo = card.picture.thumbnail;
        faker.locale = _.sample(['en', 'ru']);
        user.displayName = `${faker.name.firstName(0)} ${faker.name.lastName(0)}`;
      } else {
        faker.locale = 'en';
        user.displayName = `${faker.helpers.contextualCard().username.slice(0, _.random(5, 10))}`;
      }
      user.balance = START_BOT_BALANCE;
    }
  });

  User.prototype.verifyPassword = function (password) {
    return password === this.password;
  };

  return User;
};
