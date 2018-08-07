export default () => (req, res) => {
  delete req.user.password;
  res.send(req.user.toJSON());
};
