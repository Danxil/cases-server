import _ from 'lodash';
import gameSpin from './gameSpin';
import gameUserConnect from './gameUserConnect';
import { getRandomPhoto, setPhotoInProgress, removePhotoFromProgress } from '../../helpers/botsUtils';
import { GAME_MIN_ALIVE_GAMES_AMOUNT } from '../../gameConfig';

export default async ({
  ws,
  gameCtrl,
  userCtrl,
}) => {
  const notExpiredGames = await gameCtrl.getNotExpiredGames();
  const map = await Promise.all(notExpiredGames.map(async (game) => {
    const isGameInProgress = await gameCtrl.isGameInProgress({ game });
    if (isGameInProgress) return null;
    return game;
  }));
  const gamesNotInProgress = map.filter(o => o && !o.creatorUserId);
  if (
    !gamesNotInProgress.length ||
    notExpiredGames.length - gamesNotInProgress.length >= Math.round(
      GAME_MIN_ALIVE_GAMES_AMOUNT / 3,
    )
  ) return;
  const user = await userCtrl.createBot();

  const { id: gameId } = _.sample(gamesNotInProgress);
  const photo = getRandomPhoto();
  setPhotoInProgress(photo);
  user.photo = photo;

  await gameUserConnect({
    ws,
    gameCtrl,
    user,
    payload: { gameId },
  });

  await gameSpin({
    ws,
    gameCtrl,
    payload: { gameId, result: _.random(-0.5, 0.5) },
    user,
    botMode: true,
  });
  removePhotoFromProgress(photo);
};
