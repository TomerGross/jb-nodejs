const axios = require('axios');
const cheerio = require('cheerio');

async function validateSymbol(symbol) {
  try {
    const response = await axios.get('https://www.google.com/finance/markets/cryptocurrencies?hl=en');
    const $ = cheerio.load(response.data);
    const valueString = $(`a:contains("${symbol}")`).find('div.YMlKec').text().trim();
    return valueString.length > 0;
  } catch (error) {
    console.error('Error validating symbol:', error);
    return false;
  }
}

module.exports = { validateSymbol };
