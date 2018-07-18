import io from 'socket.io-client';

describe('socket', () => {
  it('connect', () => {
    try {
      const socket = io('http://localhost:3001');
      socket.emit('game', { a: 11 });

      socket.on('connected', (data) => {
        expect(data.hello).toBe('world');
      });
    } catch (err) {
      throw new Error(err.stack);
    }
  });
});
