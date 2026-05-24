const logger = require('../../infrastructure/logging/logger');

/**
 * Maps known error patterns to HTTP status codes and clean messages.
 * Keeps all error-classification logic in one place (Single Responsibility).
 */
const ERROR_MAP = [
  // JWT errors
  { match: (e) => e.name === 'JsonWebTokenError', status: 401, message: 'Invalid token' },
  { match: (e) => e.name === 'TokenExpiredError',  status: 401, message: 'Token expired' },

  // PostgreSQL constraint errors
  { match: (e) => e.code === '23505', status: 409, message: 'Resource already exists' },
  { match: (e) => e.code === '23503', status: 400, message: 'Invalid reference: related resource not found' },
  { match: (e) => e.code === '23502', status: 400, message: 'Missing required field' },
  { match: (e) => e.code === '42P01', status: 500, message: 'Database schema error' },

  // Application-level message patterns
  { match: (e) => /validation failed/i.test(e.message),         status: 400, message: null },
  { match: (e) => /already exists/i.test(e.message),            status: 409, message: null },
  { match: (e) => /invalid email or password/i.test(e.message), status: 401, message: null },
  { match: (e) => /unauthorized/i.test(e.message),              status: 401, message: null },
  { match: (e) => /forbidden/i.test(e.message),                 status: 403, message: null },
  { match: (e) => /not found/i.test(e.message),                 status: 404, message: null },

  // AI / external service errors
  { match: (e) => /quota|rate.?limit/i.test(e.message), status: 429, message: 'AI service rate limit exceeded. Please try again later.' },
  { match: (e) => /api.?key/i.test(e.message),          status: 503, message: 'AI service is not configured' },
  { match: (e) => /timeout/i.test(e.message),           status: 504, message: 'Upstream service timed out' },
];

/**
 * Returns true if the message is safe to expose to API consumers.
 */
function isSafeMessage(msg) {
  if (!msg || typeof msg !== 'string') return false;
  if (msg.length > 300) return false;
  if (/\bat\b.+:\d+:\d+/.test(msg)) return false;
  return true;
}

/**
 * Express error-handling middleware.
 * Must be registered AFTER all routes: app.use(errorHandler)
 */
const errorHandler = (err, req, res, next) => {
  logger.error(
    {
      err,
      path: req.originalUrl,
      method: req.method,
      requestId: req.id ?? req.headers['x-request-id'],
    },
    'Request error'
  );

  let statusCode = 500;
  let message = 'Internal Server Error';

  // Walk the error map — first match wins
  for (const rule of ERROR_MAP) {
    if (rule.match(err)) {
      statusCode = rule.status;
      message = rule.message ?? (isSafeMessage(err.message) ? err.message : message);
      break;
    }
  }

  // Never leak internal details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
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