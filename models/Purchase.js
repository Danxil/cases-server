import Sequelize from 'sequelize';

export default (sequelize) => {
  const Purchase = sequelize.define('Purchase', {
    status: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'inProgress',
    },
    amount: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    operationId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  }, {
    name: {
      singular: 'purchase',
      plural: 'purchases',
    },
  });

  Purchase.associate = (models) => {
    models.Purchase.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Purchase;
};
