const axios = require('axios');
const cheerio = require('cheerio');
const Cryptocurrency = require('./cryptocurrency');
const getConnection = require('./mysql-db');

async function scrapeCryptocurrencyValues(io) {
  try {
    const response = await axios.get('https://www.google.com/finance/markets/cryptocurrencies?hl=en');
    const $ = cheerio.load(response.data);

    // Scrape values for BTC, ETH, and other cryptocurrencies
    const connection = await getConnection();

    // Fetch distinct symbols from users_symbols table in SQL
    const symbolRows = await connection.queryAsync('SELECT DISTINCT symbol FROM users_symbols');
    const symbols = symbolRows.map(row => row.symbol);
    console.log(`symbols: ${symbols}`);
    const scrapedCryptocurrencies = [];

    symbols.forEach((symbol) => {
      const valueString = $(`a:contains("${symbol}")`).find('div.YMlKec').text().trim();
      const value = parseFloat(valueString.replace(/,/g, ''));
      console.log(`${symbol} : ${value}`);
      scrapedCryptocurrencies.push({ symbol, value });
    });

    // Save the scraped values in MongoDB
    await Cryptocurrency.insertMany(scrapedCryptocurrencies);
    io.emit('cryptocurrencyValues', scrapedCryptocurrencies);
    console.log(`Emitted new values`);
    console.log('Cryptocurrency values scraped and saved.');

  } catch (error) {
    console.error('Error scraping cryptocurrency values:', error);
  }
}

module.exports = scrapeCryptocurrencyValues;


