const logger = require('../utils/logger');

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  logger.error(error.message, error.details || error.stack);

  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    message: error.message || 'Internal server error.',
    details: error.details,
  });
}

module.exports = errorHandler;