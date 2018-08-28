export default () => async (req, res) => {
  console.log(1, req.params);
  console.log(2, req.body);
  return res.send(200);
};
