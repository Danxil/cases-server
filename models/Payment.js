import Sequelize from 'sequelize';

export default (sequelize) => {
  const Payment = sequelize.define('Payment', {
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
