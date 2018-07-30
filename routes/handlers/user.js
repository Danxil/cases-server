export default () => (req, res) => {
  console.log(5);
  delete req.user.password;
  console.log(6);
  res.send(req.user.toJSON());
};
