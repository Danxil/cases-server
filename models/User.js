import Sequelize from 'sequelize';

import { MIN_AMOUNT_OF_WITHDRAWING, START_USER_BALANCE } from '../gameConfig';

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
    isDemoMode: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    welcomeConfirmed: {
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

  User.beforeUpdate(async (user) => {
    if (user.balance >= MIN_AMOUNT_OF_WITHDRAWING) {
      user.wasAbleToWithdraw = true;
    }
    if (user.isDemoMode && user.balance >= START_USER_BALANCE * 3) {
      user.isDemoMode = false;
    }
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

  User.prototype.verifyPassword = function (password) {
    return password === this.password;
  };

  return User;
};
