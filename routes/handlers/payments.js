import _ from 'lodash';
import { getRandomPayment } from '../../helpers/fakesUtils';
import { MIN_PAYMENTS_TO_SHOW } from '../../gameConfig';

export default ({ paymentsCtrl }) => async (req, res) => {
  const history = await paymentsCtrl.getHistory();
  const fakePaymentsLength = history.length < MIN_PAYMENTS_TO_SHOW ?
    MIN_PAYMENTS_TO_SHOW - history.length :
    0;
  const fakePayments = new Array(fakePaymentsLength)
  .fill()
  .map(() => getRandomPayment());
  console.log(11, fakePaymentsLength);
  const result = _.sortBy(history.concat(fakePayments), 'createdAt');
  res.send(result);
};
