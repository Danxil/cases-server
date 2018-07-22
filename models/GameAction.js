import Sequelize from 'sequelize';

export default (sequelize) => {
  const GameAction = sequelize.define('GameAction', {
    type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    payload: {
      type: Sequelize.JSONB,
      allowNull: false,
    },
  }, {
    name: {
      singular: 'gameAction',
      plural: 'gameActions',
    },
  });

  GameAction.associate = (models) => {
    models.GameAction.belongsTo(models.User, { foreignKey: 'userId' });
    models.GameAction.belongsTo(models.Game, { foreignKey: 'gameId' });
  };

  return GameAction;
};
