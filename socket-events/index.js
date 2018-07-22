
export default ({ ws, gameCtrl }) => {
  ws.on('ADD_GAME_ACTION', async ({ gameId, action }, { id: userId }) => {
    try {
      await gameCtrl.addUserAction({ gameId, userId, action });
    } catch (err) {
      console.error(err);
    }
  });
};
