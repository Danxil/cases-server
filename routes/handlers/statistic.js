import { getBots } from '../../controllers/fakes';

export default () => (req, res) => {
  const statisticBots = getBots().filter(o => o.balance >= 10).sort((a, b) => {
    return a.balance > b.balance ? -1 : 1;
  }).splice(0, 100);
  res.send(statisticBots);
};
