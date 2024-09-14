const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Create an Express application
const app = express();

// Create an HTTP server
const server = http.createServer(app);

// Initialize socket.io with the HTTP server
const io = socketIo(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('a user connected');
  
  // Notify all clients that a new user has connected
  io.emit('user connected', socket.id);

  // Handle 'new user' event
  socket.on('new user', () => {
    io.emit('user connected', socket.id);
  });

  // Handle 'offer' event
  socket.on('offer', (userId, offer) => {
    socket.broadcast.emit('offer', userId, offer);
  });

  // Handle 'answer' event
  socket.on('answer', (userId, answer) => {
    socket.broadcast.emit('answer', userId, answer);
  });

  // Handle 'candidate' event
  socket.on('candidate', (userId, candidate) => {
    socket.broadcast.emit('candidate', userId, candidate);
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    io.emit('user disconnected', socket.id);
    console.log('user disconnected');
  });

  // Handle chat messages
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server running on port 3000');
});






