const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.resolve(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Define the guest log stream
const guestLogStream = fs.createWriteStream(path.join(logsDir, 'guest.log'), { flags: 'a' });

// Define the user log stream
const userLogStream = fs.createWriteStream(path.join(logsDir, 'user.log'), { flags: 'a' });

// Middleware to log guest requests
const logGuestRequests = morgan('combined', { stream: guestLogStream });

// Middleware to log user requests
const logUserRequests = morgan('combined', { stream: userLogStream });

module.exports = {
  logGuestRequests,
  logUserRequests,
};
