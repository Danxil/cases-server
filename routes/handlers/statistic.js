import { getStatisticBots } from '../../controllers/fakes';

export default () => (req, res) => {
  res.send(getStatisticBots());
};
