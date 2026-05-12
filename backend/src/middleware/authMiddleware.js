const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../services/tokenService');

function maskToken(token) {
  if (!token) return 'missing';
  if (token.length <= 12) return `${token[0]}***${token[token.length - 1]}`;
  return `${token.slice(0, 6)}...${token.slice(-4)} (len=${token.length})`;
}

function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, rawToken] = authorization.split(' ');
  const isBearer = scheme?.toLowerCase() === 'bearer';
  const token = isBearer ? rawToken?.trim() : '';

  if (!token) {
    console.warn(
      `[Auth] missing token: path=${req.method} ${req.originalUrl} authHeader=${authorization || 'none'}`
    );
    return next(new ApiError(401, 'Authorization token is required.'));
  }

  try {
    const payload = verifyAccessToken(token, { clockTolerance: 5 });
    req.auth = { userId: payload.sub, email: payload.email };
    return next();
  } catch (error) {
    console.warn(
      `[Auth] token rejected: path=${req.method} ${req.originalUrl} ` +
        `reason=${error?.name || 'unknown'} token=${maskToken(token)}`
    );
    if (error?.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Authorization token is expired.'));
    }
    return next(new ApiError(401, 'Authorization token is invalid.'));
  }
}

module.exports = authMiddleware;