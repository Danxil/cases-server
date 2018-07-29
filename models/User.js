import Sequelize from 'sequelize';

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
      defaultValue: 50,
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
  }, {
    name: {
      singular: 'user',
      plural: 'users',
    },
  });

  User.prototype.verifyPassword = function (password) {
    return password === this.password;
  };

  return User;
};
