  export default async ({
    ws,
    gameCtrl,
    user,
    payload: {
      game,
    },
  }) => {
    const isBalanceEnough = gameCtrl.isBalanceEnough({ game, user });
    if (!isBalanceEnough) return;

    const defaults = { ...game, creatorUserId: user.id };
    const createdGame = await gameCtrl.createGame({ defaults });
    if (!createdGame) return;
    let jsonGame = createdGame.toJSON();
    jsonGame = { ...jsonGame, creatorUser: user.toJSON() };
    const updatedUser = await user.update({
      balance: user.balance - (game.prize * game.maxAttempts),
    });
    ws.send(user.id, 'USER_UPDATED', updatedUser);
    ws.send('*', 'GAME_CREATED', { game: jsonGame });
  };
