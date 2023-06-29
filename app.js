const express = require('express');
const path = require('path');
const db = require('./utils/mongo-db');
const scrapeCryptocurrencyValues = require('./utils/worker');
const cron = require('cron');
const http = require('http');
const app = express();
const server = http.createServer(app);
const socket = require('./utils/socket');
const io = require('socket.io')(server);
const { sessionMiddleware, initializeSession } = require('./middlewares/sessionMiddleware');
const { logGuestRequests, logUserRequests } = require('./middlewares/loggingMiddleware');
const { authenticateUser } = require('./middlewares/authMiddleware');

app.use(express.static('public'));
app.use(sessionMiddleware);
app.use(initializeSession);

// Set the io object in the shared module
socket.setIO(io);

// Require the route files
const guestRoutes = require('./routes/guestRoutes');
const userRoutes = require('./routes/userRoutes');

// Use the routes in the app
app.use('/', logGuestRequests, guestRoutes);
app.use('/user', logUserRequests, authenticateUser, userRoutes);

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
