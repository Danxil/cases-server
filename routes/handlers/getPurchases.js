import purchasesCtrl from '../../controllers/purchases';

export default () => async (req, res) => {
  const filter = JSON.parse(req.query.filter);
  const history = await purchasesCtrl.getHistory({ filter });
  return res.send(history);
};
