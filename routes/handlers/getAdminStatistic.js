import { getNotExpiredGames } from '../../controllers/game';
import { START_USER_BALANCE, START_BOT_BALANCE, MIN_AMOUNT_OF_WITHDRAWING } from '../../gameConfig';

const getUsersStatistic = async ({ forBots = false }) => {
  const usersOptions = { where: { bot: forBots, isAdmin: false } };
  const users = await global.db.User.findAll(usersOptions);
  const withdraws = await global.db.Withdraw.findAll();

  const usersCanWithdrawWithoutPayments = users
    .filter(o => o.paid === 0 && o.balance >= MIN_AMOUNT_OF_WITHDRAWING).length;
  const usersCanWithdrawWithPayments = users
    .filter(o => o.paid > 0 && o.balance >= MIN_AMOUNT_OF_WITHDRAWING).length;
  const usersWasAbleToWithdrawWithoutPayments = users
    .filter(o => (
      o.paid === 0 &&
      o.balance < MIN_AMOUNT_OF_WITHDRAWING &&
      o.wasAbleToWithdraw
    )).length;
  const usersWasAbleToWithdrawWithPayments = users
    .filter(o => (
      o.paid > 0 &&
      o.balance < MIN_AMOUNT_OF_WITHDRAWING &&
      o.wasAbleToWithdraw
    )).length;
  const totalWithdraws = withdraws.reduce((prev, o) => o.amount + prev, 0);
  const totalBalanceForAllTime = users
    .reduce((prev, o) => o.balance + prev, 0) + totalWithdraws;
  const totalPaid = users.reduce((prev, o) => o.paid + prev, 0);
  const profit = totalPaid - totalWithdraws;
  let bonusesIssued;
  if (!forBots) {
    bonusesIssued = users.length * START_USER_BALANCE;
  } else {
    bonusesIssued = users.length * START_BOT_BALANCE;
  }
  const usersWon = totalBalanceForAllTime - bonusesIssued;
  return {
    users: users.length,
    totalBalanceForAllTime,
    totalPaid,
    profit,
    bonusesIssued,
    usersWon,
    usersCanWithdrawWithoutPayments,
    usersCanWithdrawWithPayments,
    usersWasAbleToWithdrawWithoutPayments,
    usersWasAbleToWithdrawWithPayments,
  };
};

const getUsersFileds = ({ source, gamesInProgress }) => {
  return [
    {
      label: 'Users',
      value: source.users,
    },
    {
      label: 'Users in progress',
      value: gamesInProgress,
    },
    {
      label: 'Profit',
      value: source.profit.toFixed(),
    },
    {
      label: 'Users paid',
      value: source.totalPaid.toFixed(),
    },
    {
      label: 'Users won',
      value: source.usersWon.toFixed(),
    },
    {
      label: 'Users can withdraw without payments',
      value: source.usersCanWithdrawWithoutPayments.toFixed(),
    },
    {
      label: 'Users can withdraw with payments',
      value: source.usersCanWithdrawWithPayments.toFixed(),
    },
    {
      label: 'Users was able to withdraw without payments',
      value: source.usersWasAbleToWithdrawWithoutPayments.toFixed(),
    },
    {
      label: 'Users was able to withdraw with payments',
      value: source.usersWasAbleToWithdrawWithPayments.toFixed(),
    },
    {
      label: 'Bonuses issued',
      value: source.bonusesIssued.toFixed(),
    },
    {
      label: 'Users balance for all time',
      value: source.totalBalanceForAllTime.toFixed(),
    },
  ];
};

export default () => async (req, res) => {
  const realUsersStatistic = await getUsersStatistic({ forBots: false });
  const botsStatistic = await getUsersStatistic({ forBots: true });
  const notExpiredGames = await getNotExpiredGames();
  const tables = await global.db.Table.findAll();
  const gamesInProgress = notExpiredGames.filter(o => o.connectedUserId);
  const gamesInProgressWithBots = notExpiredGames
    .filter(o => o.connectedUserId && o.connectedUser.bot);
  const gamesInProgressWithRealPlayers = notExpiredGames
    .filter(o => o.connectedUserId && !o.connectedUser.bot);
  return res.send({
    fields: [
      {
        label: 'Real users statistic',
        fields: getUsersFileds({
          source: realUsersStatistic,
          gamesInProgress: gamesInProgressWithRealPlayers.length,
        }),
      },
      {
        label: 'Bots statistic',
        fields: getUsersFileds({
          source: botsStatistic,
          gamesInProgress: gamesInProgressWithBots.length,
        }),
      },
      {
        label: 'Others',
        fields: [
          {
            label: 'Games created',
            value: notExpiredGames.length,
          },
          {
            label: 'Games in progress',
            value: gamesInProgress.length,
          },
          {
            label: 'Tables',
            fields: tables.map(table => ({
              label: `tableId: ${table.id}, min: ${table.min}, max: ${table.max}`,
              fields: [
                {
                  label: 'Games created',
                  value: notExpiredGames.filter(game => game.tableId === table.id).length,
                },
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
      },
    ],
  });
};
