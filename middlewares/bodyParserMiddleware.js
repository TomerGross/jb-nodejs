const bodyParser = require('body-parser');

// Middleware to parse request bodies
const bodyParserMiddleware = [
  bodyParser.urlencoded({ extended: true }),
  bodyParser.json()
];

module.exports = bodyParserMiddleware;
