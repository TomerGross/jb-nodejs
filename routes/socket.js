// socket.js
let ioInstance;

function setIO(io) {
  ioInstance = io;
}

function getIO() {
  return ioInstance;
}

module.exports = { setIO, getIO };
