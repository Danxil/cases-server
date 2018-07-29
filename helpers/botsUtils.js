import faker from 'faker';
import _ from 'lodash';

export const generatePhotos = amount => Array(amount).fill().map(() => faker.image.avatar());
export const generateStatisticBots = amount => Array(amount).fill().map(() => ({
  photo: faker.image.avatar(),
  balance: _.random(1000, 5000),
  displayName: `${faker.name.firstName()} ${faker.name.lastName()}`,
}));
let photos = generatePhotos(10);
let statisticBots = generateStatisticBots(50);
let photosInProgress = [];

export const updatePhotos = (amount) => {
  photos = generatePhotos(amount);
};
export const updateStatisticBots = (amount) => {
  statisticBots = generateStatisticBots(amount);
};

export const getRandomPhoto = () => _.sample(
  photos.filter(o => photosInProgress.indexOf(o) === -1),
);
export const setPhotoInProgress = photo => photosInProgress.push(photo);
export const removePhotoFromProgress = (photo) => {
  photosInProgress = photosInProgress.filter(o => o !== photo);
};
export const getStatisticBots = () => statisticBots.sort((a, b) => {
  return a.balance > b.balance ? -1 : 1;
});
