import db from '../services/db';
import UserCtrl from './user';
import { mockUser } from '../mocks';

const userCtrl = new UserCtrl(db);

let existedUser;
let user;

const notExistedLogin = 'user2367';
const existedLogin = 'user1';
const password = '123456';

beforeAll(async () => {
  existedUser = await db.User.create(mockUser({ login: existedLogin }));
});

afterAll(async () => {
  await db.User.destroy({ where: { id: user.id } });
  await db.User.destroy({ where: { id: existedUser.id } });
});

describe('user', () => {
  describe('signUp', () => {
    it('should throw error for existed login', async () => {
      let error;
      try {
        await userCtrl.signUp({ login: existedLogin });
      } catch (err) {
        error = err;
      }
      expect(error.message).toBe(`User with login ${existedLogin} is already exist`);
    });
    it('should throw error without password', async () => {
      let error;
      try {
        await userCtrl.signUp({ login: 'eshth' });
      } catch (err) {
        error = err;
      }
      expect(error.message).toBe('notNull Violation: password cannot be null');
    });
    it('should create user for not existed login', async () => {
      try {
        user = await userCtrl.signUp({ login: notExistedLogin, password });
        expect(user.login).toBe(notExistedLogin);
        expect(user.password).toBe(password);
      } catch (err) {
        throw new Error(err.stack);
      }
    });
  });
  describe('signIn', () => {
    it('should throw error for not existed login', async () => {
      let error = null;
      try {
        await userCtrl.signIn({ login: 'esgegseg' });
      } catch (err) {
        error = err;
      }
      expect(error.message).toBe('Login or password is wrong');
    });
    it('should throw error for wrong password', async () => {
      let error = null;
      try {
        await userCtrl.signIn({ login: existedLogin, password: '11' });
      } catch (err) {
        error = err;
      }
      expect(error.message).toBe('Login or password is wrong');
    });
    it('should signIn success', async () => {
      try {
        const result = await userCtrl.signIn({ login: existedLogin, password });
        expect(result.login).toBe(existedLogin);
        expect(result.password).toBe(password);
        expect(typeof result.id).toBe('number');
      } catch (err) {
        throw new Error(err.stack);
      }
    });
  });
});
