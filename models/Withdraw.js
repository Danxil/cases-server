import Sequelize from 'sequelize';

export default (sequelize) => {
  const Withdraw = sequelize.define('Withdraw', {
    status: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'inProgress',
    },
    amount: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    method: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    requisite: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  }, {
    name: {
      singular: 'withdraw',
      plural: 'withdraws',
    },
  });

  Withdraw.associate = (models) => {
    models.Withdraw.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Withdraw;
};
