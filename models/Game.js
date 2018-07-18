export default (sequelize) => {
  return sequelize.define('Game', {
  }, {
    name: {
      singular: 'game',
      plural: 'games',
    },
    classMethods: {
      associate(models) {
        models.Game.hasMany(models.GameAction, { foreignKey: 'gameId' });
        models.Game.hasMany(models.GameUser, { foreignKey: 'gameId' });
      },
    },
  });
};
