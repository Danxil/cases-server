import gameConfig from '../../gameConfig';

export default () => async (req, res) => {
  return res.send(gameConfig);
};
