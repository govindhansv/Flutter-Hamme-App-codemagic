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

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};