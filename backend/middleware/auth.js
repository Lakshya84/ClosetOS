const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforauravault123');

    // Attach decoded user info (including id) to request object
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication Error:', error.message);
    
    // Return 401 on token expiration or malformed tokens
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please log in again', code: 'TOKEN_EXPIRED' });
    }
    
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
