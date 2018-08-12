import Sequelize from 'sequelize';
import _ from 'lodash';
import request from 'request-promise';
import faker from 'faker';
import { START_USER_BALANCE } from '../gameConfig';

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

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
      defaultValue: START_USER_BALANCE * 100,
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
  }, {
    name: {
      singular: 'user',
      plural: 'users',
    },
  });

  User.beforeValidate(async (user) => {
    if (user.bot && !user.photo) {
      try {
        const randomUserJson = await request('https://randomuser.me/api/');
        const randomUser = JSON.parse(randomUserJson).results[0];
        user.photo = JSON.parse(randomUser).results[0].picture.thumbnail;
        user.displayName = `${capitalizeFirstLetter(randomUser.name.first)} ${capitalizeFirstLetter(randomUser.name.last)}`;
      } catch (e) {
        user.photo = 0;
      }
      user.displayName = `${faker.name.firstName()} ${faker.name.lastName()}`;
      user.balance = _.random(1000, 5000);
    }
  });

  User.prototype.verifyPassword = function (password) {
    return password === this.password;
  };

  return User;
};
