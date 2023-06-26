// cryptocurrency.js

const mongoose = require('mongoose');

const cryptocurrencySchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    minlength: 3,
    maxlength: 10,
  },
  value: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Cryptocurrency', cryptocurrencySchema);
