const express = require('express');
const axios = require('axios');
const router = express.Router();
const config = require('config');
const getConnection = require('../databases/mysql-db');


// Welcome view
router.get('/welcome', (req, res) => {
  res.render('welcome');
});

// GitHub routes
router.get('/github', (req, res) => {
  // Redirect to GitHub for authentication
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${config.get('github.clientId')}&redirect_uri=http://localhost:3000/callback`);
});

// Callback route
router.get('/callback', async (req, res) => {
  // Authentication callback logic
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
        // User exist, extract it's id
        const userIdRow = await connection.queryAsync('SELECT id FROM users WHERE username = ?', [username]);
        req.session.userId = userIdRow[0].id;

        // User already exists, redirect to the dashboard
        res.redirect('/user/dashboard');
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
        setTimeout(() => {
          res.redirect('/user/dashboard');
        }, 1000); 
        
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

module.exports = router;
