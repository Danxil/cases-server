export default({ gameCtrl }) => {
  setInterval(
    gameCtrl.checkNotExpiredGames.bind(gameCtrl),
    process.env.GAME_CHECK_ALIVE_GAMES_INTERVAL,
  );
};
