export default () => async (req, res) => {
  const tables = await global.db.Table.findAll();
  return res.send(tables);
};
