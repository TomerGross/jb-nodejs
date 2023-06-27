const express = require('express');
//const session = require('express-session');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./databases/mongo-db');
const scrapeCryptocurrencyValues = require('./worker');
const cron = require('cron');
const http = require('http');
const app = express();
const server = http.createServer(app);
// const { Server } = require('socket.io');
// const io = new Server(server);
const socket = require('./socket');
const io = require('socket.io')(server);

const authMiddleware = require('./middlewares/authMiddleware');
const { sessionMiddleware, initializeSession } = require('./middlewares/sessionMiddleware');


app.use(express.static('public'));
app.use(sessionMiddleware);
app.use(initializeSession);


// Set the io object in the shared module
socket.setIO(io);

// Require the route files
const guestRoutes = require('./routes/guestRoutes');
const userRoutes = require('./routes/userRoutes');

// Use the routes in the app
app.use('/', guestRoutes);
app.use('/user', authMiddleware.authenticateUser, userRoutes);


// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Middleware for logging requests
app.use(morgan('combined', {
  stream: fs.createWriteStream(path.join(logsDir, 'admin.log'), { flags: 'a' })
}));

// Middleware to log guest requests
const logGuestRequests = (req, res, next) => {
    fs.appendFileSync(path.join(logsDir, 'guests.log'), `${req.method} ${req.url}\n`);
    next();
};

// Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


io.on('connection', (socket) => {
  console.log('New client connected.');
  // Handle the 'disconnect' event when a client disconnects
  socket.on('disconnect', () => {
    console.log('Client disconnected.');
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

// Start the worker script
// Schedule the scraping job to run every hour
const job = new cron.CronJob('*/1 * * * *', () => {
  console.log('Scraping cryptocurrency values...');
  scrapeCryptocurrencyValues(io);
});

job.start();

module.exports.io = io;
