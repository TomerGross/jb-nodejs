const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const Joi = require('joi');
const bodyParser = require('body-parser');
const config = require('config');
const db = require('./databases/mongo-db');
const getConnection = require('./databases/mysql-db');

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
app.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    const userId = req.session.userId; // Assuming you have stored the user's ID in the session
    const connection = await getConnection();

    // Fetch the subscribed symbols for the user
    const symbolRows = await connection.queryAsync('SELECT symbol FROM users_symbols WHERE user_id = ?', [userId]);
    const userSymbols = symbolRows.map(row => row.symbol);

    res.render('userDashboard', { userSymbols });
    
    connection.release();
  } catch (error) {
    console.error('Error retrieving user symbols:', error);
    res.redirect('/welcome');
  }
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

const axios = require('axios');

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  // Use the code to retrieve access token from GitHub
  // Handle authentication callback logic
  
  try {
    // Retrieve access token from GitHub using the code
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: config.get('github.clientId'),
      client_secret: config.get('github.secret'),
      code: code
    }, {
      headers: {
        Accept: 'application/json'
      }
    });
    
    const accessToken = response.data.access_token;
    
    // Retrieve user information from GitHub API
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    const username = userResponse.data.login;

    // Assuming authentication was successful, set the session for the user
    req.session.isUser = true;
    
    try {
      const connection = await getConnection();

      // Check if the user already exists in the MySQL database
      const rows = await connection.queryAsync('SELECT * FROM users WHERE username = ?', [username]);
      
      if (rows.length > 0) {
        // User already exists, redirect to the dashboard
        res.redirect('/dashboard');
      } else {
        // User does not exist, insert a new entry in the users table
        const result = await connection.queryAsync('INSERT INTO users (username) VALUES (?)', [username]);

        // Insert a new entry in the users_symbols table
        const userId = result.insertId;
        req.session.userId = userId;
        console.log(`userId: ${userId}`);

        const userSymbols = ['BTC', 'ETH', 'LTC']; // Example userSymbols data
        
        for (const symbol of userSymbols) {
          await connection.queryAsync('INSERT INTO users_symbols (user_id, symbol) VALUES (?, ?)', [userId, symbol]);
        }
        
        res.redirect('/dashboard');
      }
  
      connection.releaseAsync();
    } catch (error) {
      console.error('Error checking user existence:', error);
      res.redirect('/welcome');
    }
  } catch (error) {
    console.error('Error retrieving access token:', error);
    res.redirect('/welcome');
  }
});


// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

// Start the worker script
require('./worker');