import db from './helpers/db';
import { mockUser } from './mocks';

db.User.create(mockUser({ login: 'test' }));
