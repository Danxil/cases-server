import Sequelize from 'sequelize';

export default (sequelize) => {
  return sequelize.define('GameUser', {
    isBot: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    isCreator: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  }, {
    name: {
      singular: 'gameUser',
      plural: 'gameUsers',
    },
    classMethods: {
      associate(models) {
        models.GameUser.belongsTo(models.User, { foreignKey: 'userId' });
        models.GameUser.belongsTo(models.Game, { foreignKey: 'gameId' });
      },
    },
  });
};
