const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle 'offer' event from clients
  socket.on('offer', (offer) => {
    socket.broadcast.emit('offer', offer);
  });

  // Handle 'answer' event from clients
  socket.on('answer', (answer) => {
    socket.broadcast.emit('answer', answer);
  });

  // Handle 'candidate' event from clients
  socket.on('candidate', (candidate) => {
    socket.broadcast.emit('candidate', candidate);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Set the port
const port = process.env.PORT || 3000;

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});







