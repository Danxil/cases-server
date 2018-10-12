import { getNotExpiredGames } from '../../controllers/game';
import { getBots } from '../../controllers/fakes';
import { START_USER_BALANCE } from '../../gameConfig';

export default () => async (req, res) => {
  const tables = await global.db.Table.findAll();
  const users = await global.db.User.findAll();
  const withdraws = await global.db.Withdraw.findAll();
  const totalWithdraws = withdraws.reduce((prev, o) => o.amount + prev, 0);
  const totalUsersBalanceForAllTime = users
    .reduce((prev, o) => o.balance + prev, 0) + totalWithdraws;
  const totalUsersPaid = users.reduce((prev, o) => o.paid + prev, 0);
  const bonusesIssued = users.length * START_USER_BALANCE;
  const notExpiredGames = await getNotExpiredGames();
  const gamesInProgress = notExpiredGames.filter(o => o.connectedUserId);
  const gamesInProgressWithBots = notExpiredGames
    .filter(o => o.connectedUserId && o.connectedUser.bot);
  const gamesInProgressWithRealPlayers = notExpiredGames
    .filter(o => o.connectedUserId && !o.connectedUser.bot);
  return res.send({
    fields: [
      {
        label: 'Total users balance for all time',
        value: totalUsersBalanceForAllTime.toFixed(),
      },
      {
        label: 'Total users paid',
        value: totalUsersPaid.toFixed(),
      },
      {
        label: 'Total users bonuses',
        value: bonusesIssued.toFixed(),
      },
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
