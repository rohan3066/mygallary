const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.session.token;
  console.log('Auth middleware - Token:', token);
  if (!token) {
    console.log('No token found, redirecting to login');
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.redirect('/login');
  }
};