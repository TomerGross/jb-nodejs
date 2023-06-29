const express = require('express');
const getConnection = require('../utils/mysql-db');
const Cryptocurrency = require('../utils/cryptocurrency');
const bodyParserMiddleware = require('../middlewares/bodyParserMiddleware');
const scrapeCryptocurrencyValues = require('../utils/worker');
const symbolSchema = require('../utils/validationSchema')
const { validateSymbol } = require('../utils/symbolValidator');

const socket = require('../utils/socket');
// Access the io object from the shared module

const io = socket.getIO();

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

        const { error, value } = symbolSchema.validate(symbol);
        const isValidSymbol = await validateSymbol(symbol);

        if (error) {
          console.error(`Error adding cryptocurrency: ${error.details[0].message}`);
          res.redirect('/user/dashboard');
        } else if (!isValidSymbol){
          console.error(`Error adding cryptocurrency: ${symbol} is not a valid cryptocurrency symbol`);
          res.redirect('/user/dashboard');
        } else{

          const connection = await getConnection();
          await connection.queryAsync('INSERT INTO users_symbols (user_id, symbol) VALUES (?, ?)', [userId, symbol]);

          scrapeCryptocurrencyValues(io);
          

          // Delay the page reload to ensure the new data is available
          setTimeout(() => {
              res.redirect('/user/dashboard');
          }, 3000); 

          connection.release();
        }
    } catch (error) {
        console.error('Error adding cryptocurrency:', error);
        res.redirect('/user/dashboard');
    }
});

module.exports = router;
