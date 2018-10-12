import { getNotExpiredGames } from '../../controllers/game';
import { getBots } from '../../controllers/fakes';

export default () => async (req, res) => {
  const tables = await global.db.Table.findAll();
  const notExpiredGames = await getNotExpiredGames();
  const gamesInProgress = notExpiredGames.filter(o => o.connectedUserId);
  const gamesInProgressWithBots = notExpiredGames
    .filter(o => o.connectedUserId && o.connectedUser.bot);
  const gamesInProgressWithRealPlayers = notExpiredGames
    .filter(o => o.connectedUserId && !o.connectedUser.bot);
  return res.send({
    fields: [
      {
        label: 'Bots created',
        value: getBots().length,
      },
      {
        label: 'Games in progress',
        value: gamesInProgress.length,
      },
      {
        label: 'Bots playing',
        value: gamesInProgressWithBots.length,
      },
      {
        label: 'Real players playing',
        value: gamesInProgressWithRealPlayers.length,
      },
      {
        label: 'Tables',
        fields: tables.map(table => ({
          label: `tableId: ${table.id}, min: ${table.min}, max: ${table.max}`,
          fields: [
            {
              label: 'Games in progress',
              value: gamesInProgress.filter(game => game.tableId === table.id).length,
            },
            {
              label: 'Bots playing',
              value: gamesInProgressWithBots.filter(game => game.tableId === table.id).length,
            },
            {
              label: 'Real players playing',
              value: gamesInProgressWithRealPlayers
                .filter(game => game.tableId === table.id).length,
            },
          ],
        })),
      },
    ],
  });
};
