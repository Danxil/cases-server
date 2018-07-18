import GameCtrl from '../controllers/game';

export default (ws, db) => {
  const gameCtrl = new GameCtrl(db, ws);

  ws.on('ADD_GAME_ACTION', async ({ gameId, action }, { id: userId }) => {
    try {
      await gameCtrl.addUserAction({ gameId, userId, action });
    } catch (err) {
      console.error(err);
    }
  });
};
