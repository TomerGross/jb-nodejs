const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const Joi = require('joi');
const bodyParser = require('body-parser');
const config = require('config');

const app = express();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware for logging requests
app.use(morgan('combined', {
  stream: fs.createWriteStream(path.join(logsDir, 'admin.log'), { flags: 'a' })
}));

// Middleware to log guest requests
const logGuestRequests = (req, res, next) => {
    fs.appendFileSync(path.join(logsDir, 'guests.log'), `${req.method} ${req.url}\n`);
    next();
};

// Middleware for session management
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Middleware to authenticate admin routes
const authenticateAdmin = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.redirect('/login');
};

// Middleware to authenticate user routes
const authenticateUser = (req, res, next) => {
  if (req.session && req.session.isUser) {
    return next();
  }
  res.redirect('/welcome');
};

// Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Guest routes
// Welcome view
app.get('/welcome', (req, res) => {
  res.render('welcome');
});


// User routes
// Dashboard view
app.get('/dashboard', authenticateUser, (req, res) => {
    res.render('userDashboard');
});


app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/welcome');
});


// Validation schemas

// Validation schema for user creation
const userSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    birthdate: Joi.date().iso().required() // YYYY-MM-DD

});
// Validation schema for symbol parameter
const symbolSchema = Joi.string()
  .alphanum()
  .uppercase()
  .length(3)
  .required()
  .error((errors) => {
    errors.forEach((err) => {
      switch (err.code) {
        case 'string.alphanum':
          err.message = 'Symbol must contain alphanumeric characters only';
          break;
        case 'string.uppercase':
          err.message = 'Symbol must be in uppercase';
          break;
        case 'string.length':
          err.message = 'Symbol must be exactly 3 characters long';
          break;
        case 'any.required':
          err.message = 'Symbol is required';
          break;
        default:
          break;
      }
    });
    return errors;
  });


// Post endpoints
app.post('/symbol', authenticateUser, (req, res) => {
  const { error, value } = symbolSchema.validate(req.body.symbol);

  if (error) {
    res.status(400).send(error.details[0].message);
  } else {
    // Logic to handle the symbol
    res.send('Symbol added successfully');
  }
});
  
app.post('/user', (req, res) => {
    const { error, value } = userSchema.validate(req.body);
    if (error) {
        res.status(400).send(error.details[0].message);
    } else {
        // Logic to create a new user
        res.send(`User created successfully`);
    }
});

// Get endpoints

// GitHub routes
app.get('/github', (req, res) => {
  // Redirect to GitHub for authentication
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${config.get('github.clientId')}&redirect_uri=http://localhost:3000/callback`);
});
app.get('/callback', (req, res) => {
  const { code } = req.query;
  // Use the code to retrieve access token from GitHub
  // Handle authentication callback logic
  res.send('GitHub authentication callback');
});

// MySQL configuration
const mysqlConfig = config.get('mysql');

// MongoDB configuration
const mongoConfig = config.get('mongo');

// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
