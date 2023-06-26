const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('cron');
const Cryptocurrency = require('./cryptocurrency');

async function scrapeCryptocurrencyValues() {
  try {
    const response = await axios.get('https://www.google.com/finance/markets/cryptocurrencies?hl=en');
    const $ = cheerio.load(response.data);

    // Scrape values for BTC, ETH, and other cryptocurrencies
    const symbols = ['BTC', 'ETH', 'LTC']; // Add more symbols as needed
    const scrapedCryptocurrencies = [];

    symbols.forEach((symbol) => {
      const valueString = $(`a:contains("${symbol}")`).find('div.YMlKec').text().trim();
      const value = parseFloat(valueString.replace(/,/g, ''));
      console.log(`${symbol} : ${value}`);
      scrapedCryptocurrencies.push({ symbol, value });
    });

    // Save the scraped values in MongoDB
    await Cryptocurrency.insertMany(scrapedCryptocurrencies);

    console.log('Cryptocurrency values scraped and saved.');
  } catch (error) {
    console.error('Error scraping cryptocurrency values:', error);
  }
}

// Schedule the scraping job to run every minute
const job = new cron.CronJob('*/10 * * * *', () => {
  console.log('Scraping cryptocurrency values...');
  scrapeCryptocurrencyValues()
    .then(() => {
      console.log('Cryptocurrency values scraped and saved.');
    })
    .catch((error) => {
      console.error('Error scraping cryptocurrency values:', error);
    });
});

job.start();

