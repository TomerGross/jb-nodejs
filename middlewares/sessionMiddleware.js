const session = require('express-session');

const sessionMiddleware = session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
});

const initializeSession = (req, res, next) => {
  if (!req.session) {
    return res.redirect('/error');
  }
  next();
};

module.exports = { sessionMiddleware, initializeSession };