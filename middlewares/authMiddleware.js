// Middleware to authenticate user routes
const authenticateUser = (req, res, next) => {
    if (req.session && req.session.isUser) {
        return next();
    }
    res.redirect('/welcome');
};

module.exports = { authenticateUser };
