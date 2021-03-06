export default () => async (req, res) => {
  const updatedCreatorUser = await req.user.update({ welcomeConfirmed: true });
  global.ws.send(updatedCreatorUser.id, 'USER_UPDATED', updatedCreatorUser);
  return res.sendStatus(200);
};
