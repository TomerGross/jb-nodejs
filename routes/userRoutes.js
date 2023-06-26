const express = require('express');
const getConnection = require('../databases/mysql-db');
const Cryptocurrency = require('../mongo-schemas/cryptocurrency');
const bodyParserMiddleware = require('../middlewares/bodyParserMiddleware');
const scrapeCryptocurrencyValues = require('../worker');
const { io } = require('../app');


const router = express.Router();

router.get('/dashboard', async (req, res) => {
  // Dashboard logic
  try {
    const userId = req.session.userId; // Assuming you have stored the user's ID in the session

    const connection = await getConnection();

    // Fetch the subscribed symbols for the user from MySQL
    const symbolRows = await connection.queryAsync('SELECT symbol FROM users_symbols WHERE user_id = ?', [userId]);
    
    const userSymbolsMySQL = symbolRows.map(row => row.symbol);

    // Fetch the symbol values from MongoDB
    const symbolsData = await Cryptocurrency.find({ symbol: { $in: userSymbolsMySQL } });
    const symbolValuesMongo = symbolsData.reduce((values, data) => {
      values[data.symbol] = data.value;
      return values;
    }, {});

    res.render('../views/userDashboard', { userSymbolsMySQL, symbolValuesMongo });
    
    connection.release();
  } catch (error) {
    console.error('Error retrieving user symbols:', error);
    res.redirect('/welcome');
  }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/welcome');
});

// Add cryptocurrency route
router.post('/add-cryptocurrency', bodyParserMiddleware, async (req, res) => {
    try {
        const userId = req.session.userId;
        const symbol = req.body.symbol;

        const connection = await getConnection();
        await connection.queryAsync('INSERT INTO users_symbols (user_id, symbol) VALUES (?, ?)', [userId, symbol]);

        scrapeCryptocurrencyValues(io);

        // Delay the page reload to ensure the new data is available
        setTimeout(() => {
            res.redirect('/dashboard');
        }, 3000); 

        connection.release();
    } catch (error) {
        console.error('Error adding cryptocurrency:', error);
        res.redirect('/dashboard');
    }
});

module.exports = router;