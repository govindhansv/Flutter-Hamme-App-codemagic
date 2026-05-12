const jwt = require('jsonwebtoken');

const env = require('../config/env');

function createAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessTtl,
  });
}

function createRefreshToken(user) {
  return jwt.sign({ sub: user.id }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshTtl,
  });
}

function verifyAccessToken(token, options = {}) {
  return jwt.verify(token, env.jwtAccessSecret, options);
}

function verifyRefreshToken(token, options = {}) {
  return jwt.verify(token, env.jwtRefreshSecret, options);
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};