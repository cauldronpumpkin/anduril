const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const {UV_FS_O_FILEMAP} = require('constants');

const app = express();
const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: "*",
  }
});

app.use(express.static(path.join(__dirname, 'public')));

const port = 4321;

io.on('connection', (socket) => {
  socket.on('toServer', data => {
    io.emit('fromServer', data)
  })
});

server.listen(port, () => {
  console.log(`App listening at http://localhost:${port}\n`)
});