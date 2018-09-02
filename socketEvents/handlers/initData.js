import { getInitData } from '../../controllers/game';

export default async ({
  user: { id },
}) => {
  const result = await getInitData();
  global.ws.send(id, 'INIT_DATA', result);
};
