const jwt = require('jsonwebtoken');
const config = require('../../config/env');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'Access token required',
          status: 401
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, config.jwt.secret);
    
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: {
          message: 'Invalid token',
          status: 401
        }
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          message: 'Token expired',
          status: 401
        }
      });
    }
    
    return res.status(401).json({
      error: {
        message: 'Unauthorized',
        status: 401
      }
    });
  }
};

module.exports = { authMiddleware };
