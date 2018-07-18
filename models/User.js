import Sequelize from 'sequelize';

export default (sequelize) => {
  return sequelize.define('User', {
    facebookId: {
      type: Sequelize.BIGINT,
      defaultValue: null,
    },
    login: Sequelize.STRING,
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
  }, {
    name: {
      singular: 'user',
      plural: 'users',
    },
  });
};
