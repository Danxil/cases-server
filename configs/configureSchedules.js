export default({ gameCtrl }) => {
  setInterval(async () => {
    try {
      await gameCtrl.checkNotExpiredGames.call(gameCtrl);
    } catch (e) {
      console.log(111, e);
    }
  }, process.env.GAME_CHECK_ALIVE_GAMES_INTERVAL);
};
