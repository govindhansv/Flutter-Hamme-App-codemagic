const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../services/tokenService');

function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authorization token is required.'));
  }

  const token = authorization.replace('Bearer ', '');

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, email: payload.email };
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Authorization token is invalid or expired.'));
  }
}

module.exports = authMiddleware;