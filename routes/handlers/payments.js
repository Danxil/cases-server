import _ from 'lodash';
import { getPayments } from '../../controllers/fakes';
import { getHistory } from '../../controllers/payments';
import { MIN_PAYMENTS_TO_SHOW } from '../../gameConfig';

export default () => async (req, res) => {
  const filter = JSON.parse(req.query.filter);
  const history = await getHistory({ filter });
  const fakePaymentsLength = history.length < MIN_PAYMENTS_TO_SHOW && !filter.userId ?
    MIN_PAYMENTS_TO_SHOW - history.length :
    0;
  const fakePayments = getPayments();
  const fakePaymentsToAdd = fakePayments.slice(0, fakePaymentsLength);
  const result = _.sortBy(history.concat(fakePaymentsToAdd), 'createdAt');
  return res.send(result);
};
