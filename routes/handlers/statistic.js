import { getStatisticBots } from '../../helpers/fakesUtils';

export default () => (req, res) => {
  res.send(getStatisticBots());
};
