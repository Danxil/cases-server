import { errorResponse } from '../../helpers/responses';

export default ({ userCtrl }) => async (req, res) => {
  try {
    const user = await userCtrl.signUp(req.body);
    req.login(user, () => res.send(200));
  } catch (err) {
    console.error(err);
    res.status(400).send(errorResponse(err.message));
  }
};
