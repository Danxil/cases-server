import db from './services/db';
import { mockUser } from './mocks';

db.User.create(mockUser({ login: 'test' }));
