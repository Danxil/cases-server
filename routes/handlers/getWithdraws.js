import _ from 'lodash';
import { getWithdraws } from '../../controllers/fakes';
import { getHistory } from '../../controllers/withdraws';
import { MIN_WITHDRAWS_TO_SHOW } from '../../gameConfig';

export default () => async (req, res) => {
  const filter = JSON.parse(req.query.filter);
  const history = await getHistory({ filter });
  const fakeWithdrawsLength = history.length < MIN_WITHDRAWS_TO_SHOW && !filter.userId ?
    MIN_WITHDRAWS_TO_SHOW - history.length :
    0;
  const fakeWithdraws = getWithdraws();
  const fakeWithdrawsToAdd = fakeWithdraws.slice(0, fakeWithdrawsLength);
  const result = _.sortBy(history.concat(fakeWithdrawsToAdd), 'createdAt');
  return res.send(result);
};
