const { Server } = require('socket.io');

const env = require('./config/env');

let ioInstance = null;

function initializeSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: env.clientOrigin === '*' ? true : env.clientOrigin,
      credentials: true,
    },
  });

  ioInstance.on('connection', (socket) => {
    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });
  });

  return ioInstance;
}

function emitMatchFound(userIds, payload) {
  if (!ioInstance) {
    return;
  }

  userIds.forEach((userId) => {
    ioInstance.to(`user:${userId}`).emit('match:found', payload);
  });
}

module.exports = {
  initializeSocket,
  emitMatchFound,
};