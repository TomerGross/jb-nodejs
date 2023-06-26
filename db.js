// db.js

const mongoose = require('mongoose');
const config = require('config');

const mongoConfig = config.get('mongo');

// Connect to MongoDB
mongoose.connect(`mongodb://${mongoConfig.host}:${mongoConfig.port}/${mongoConfig.db}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


// Create a connection instance
const db = mongoose.connection;

// Handle connection events
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

module.exports = db;
