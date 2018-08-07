import Sequelize from 'sequelize';

export default (sequelize) => {
  const Payment = sequelize.define('Payment', {
    status: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'inProgress',
    },
    amount: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
  }, {
    name: {
      singular: 'payment',
      plural: 'payments',
    },
  });

  Payment.associate = (models) => {
    models.Payment.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Payment;
};
