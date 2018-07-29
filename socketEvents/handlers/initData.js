export default async ({
  ws,
  gameCtrl,
  user: { id },
}) => {
  const result = await gameCtrl.getInitData();
  ws.send(id, 'INIT_DATA', result);
};
