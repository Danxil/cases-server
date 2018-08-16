export default () => (req, res) => {
  req.logout();
  res.clearCookie('connect.sid');
  res.sendStatus(200);
};
