export default({ gameCtrl }) => {
  setInterval(async () => {
    console.log('===================');
    try {
      await gameCtrl.checkNotExpiredGames.call(gameCtrl);
    } catch (e) {
      console.log(e);
    }
  }, process.env.GAME_CHECK_ALIVE_GAMES_INTERVAL);
};
