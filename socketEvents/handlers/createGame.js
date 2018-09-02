import { createGame } from '../../controllers/game';

export default async ({
  user,
  payload: {
    game,
  },
}) => {
  if (game.prize * game.maxAttempts > user.balance) return;
  const defaults = { ...game, creatorUserId: user.id };
  const createdGame = await createGame({ defaults });
  if (!createdGame) return;
  let jsonGame = createdGame.toJSON();
  jsonGame = { ...jsonGame, creatorUser: user.toJSON() };
  const updatedUser = await user.update({
    balance: user.balance - (game.prize * game.maxAttempts),
  }, {
    include: {
      model: global.db.Game,
      as: 'createdGame',
    },
  });
  const updatedUserJson = await updatedUser.toJSON();

  global.ws.send(user.id, 'USER_UPDATED', { ...updatedUserJson, createdGame });
  global.ws.send('*', 'GAME_CREATED', { game: jsonGame });
};
