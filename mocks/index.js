import Chance from 'chance';

const chance = new Chance();

export const mockUser = ({
  id = chance.natural({ min: 1, max: 20000 }),
  displayName = chance.name(),
  photo,
  balance = 10000000,
} = {}) => ({
  id,
  displayName,
  photo,
  balance,
});
