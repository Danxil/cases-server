import Chance from 'chance';
import { getLevelFromExperience, getNextLevelExperienceFromLevel } from '../helpers/experience';

const chance = new Chance();

export const mockUser = ({
  login = chance.name(),
  experience = chance.integer({ min: 0, max: 1000000 }),
} = {}) => {
  const gamesTotal = chance.integer({ min: 50, max: 100 });
  const gamesWon = gamesTotal - 10;
  const gamesLoose = 5;
  const gamesDraw = 5;

  const level = getLevelFromExperience(experience);
  const nextLevelExperience = getNextLevelExperienceFromLevel(level);

  return {
    login,
    password: '123456',
    experience,
    nextLevelExperience,
    level,
    gamesTotal,
    gamesWon,
    gamesLoose,
    gamesDraw,
  };
};

export const mockGameUser = (userId, gameId, isCreator = false) => {
  return {
    userId,
    gameId,
    isCreator,
  };
};

export const mockGameAction = (gameUserId, gameId, action = {}) => {
  return {
    gameUserId,
    gameId,
    action,
  };
};

export const mockGame = () => {
  return {
  };
};

export const mockUsersFactory = (count) => {
  const users = [];

  for (let i = 0; i < count; i += 1) {
    users.push(mockUser());
  }

  return users;
};

export const mockWs = () => {
  return {
    on: () => {},
    assignEvents: () => {},
    send: () => {},
  };
};
