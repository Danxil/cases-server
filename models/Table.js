import Sequelize from 'sequelize';
import { TABLES_AMOUNT, TABLES_STEP, LOW_LEVEL_GAME_PRIZE_TRESHOLD } from '../gameConfig';

export default (sequelize) => {
  const Table = sequelize.define('Table', {
    min: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    max: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  }, {
    name: {
      singular: 'table',
      plural: 'tables',
    },
  });

  Table.associate = () => {
  };

  Table.initData = async (db) => {
    const query = { min: 1, max: LOW_LEVEL_GAME_PRIZE_TRESHOLD };
    await db.Table.findOrCreate({ where: query, defaults: query });
    for (let i = 0; i < TABLES_AMOUNT; i += 1) {
      const query2 = {
        min: i * TABLES_STEP || LOW_LEVEL_GAME_PRIZE_TRESHOLD,
        max: (i + 1) * TABLES_STEP,
      };
      await db.Table.findOrCreate({ where: query2, defaults: query2 });
    }
  };

  return Table;
};
