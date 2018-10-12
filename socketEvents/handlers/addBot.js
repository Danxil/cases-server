import _ from 'lodash';
import gameSpin from './gameSpin';
import gameUserConnect from './gameUserConnect';
import { getRandomBot } from '../../controllers/fakes';
import { getNotExpiredGames } from '../../controllers/game';
import { GAMES_IN_TABLE } from '../../gameConfig';

const addBotsToTable = async ({ tableGames }) => {
  const gamesNotInProgress = tableGames.filter(o => !o.connectedUserId);
  const botsAmountToCreate = (
    Math.round((GAMES_IN_TABLE) / 4)
  ) - (tableGames.length - gamesNotInProgress.length);
  if (botsAmountToCreate <= 0) return;

  for (let i = 0; i < botsAmountToCreate; i += 1) {
    const user = getRandomBot();
    if (!user) return;

    const { id: gameId, chanceToWin } = _.sample(gamesNotInProgress);
    await gameUserConnect({
      user,
      payload: { gameId },
    });
    const result = Math.random() >= chanceToWin / 100;
    setTimeout(() => {
      gameSpin({
        payload: { gameId, result },
        user,
        botMode: true,
      }).catch((e) => {
        console.log(e);
      });
    }, _.random(0, 10000));
  }
};

const addBot = async () => {
  const notExpiredGames = await getNotExpiredGames();
  const notExpiredGamesGroupedPerTable = _.groupBy(notExpiredGames, 'tableId');
  const tables = await global.db.Table.findAll();
  const promises = tables.map(table => addBotsToTable({
    table,
    tableGames: notExpiredGamesGroupedPerTable[table.id] || [],
  }));
  return Promise.all(promises);
};

export default addBot;
