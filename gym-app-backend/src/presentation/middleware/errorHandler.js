const logger = require('../../infrastructure/logging/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(
    {
      err,
      path: req.originalUrl,
      method: req.method,
    },
    'Request error'
  );

  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err.message && typeof err.message === 'string' && err.message.length > 0 && err.message.length < 300) {
    const lower = err.message.toLowerCase();
    if (
      lower.includes('servis') ||
      lower.includes('lütfen') ||
      lower.includes('kota') ||
      lower.includes('zaman aşımı') ||
      lower.includes('ağ') ||
      lower.includes('api anahtarı')
    ) {
      message = err.message;
      statusCode = 503;
    }
  }

  if (err.message.includes('Validation failed')) {
    statusCode = 400;
    message = err.message;
  } else if (err.message.includes('already exists')) {
    statusCode = 409;
    message = err.message;
  } else if (err.message.includes('Invalid email or password')) {
    statusCode = 401;
    message = err.message;
  } else if (err.message.includes('Unauthorized')) {
    statusCode = 401;
    message = err.message;
  } else if (err.message.includes('Forbidden')) {
    statusCode = 403;
    message = err.message;
  } else if (err.message.includes('not found')) {
    statusCode = 404;
    message = err.message;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (err.code === '23505') {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.code === '23503') {
    statusCode = 400;
    message = 'Invalid reference';
  }

  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    },
  });
};

module.exports = { errorHandler };
