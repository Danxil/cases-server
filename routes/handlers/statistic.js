import { getStatisticBots } from '../../helpers/botsUtils';

export default () => (req, res) => {
  res.send(getStatisticBots());
};
