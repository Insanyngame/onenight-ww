import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import ejs from 'ejs';

const app = express();
const server = createServer(app);
const io = new Server(server);

app.set('view engine', 'ejs');
app.set('views', './views');

// const __dirname = dirname(fileURLToPath(import.meta.url));

var activeRooms = [];
const roomRegex = /^[a-zA-Z0-9]{7}$/
const userRegex = /^[a-zA-Z0-9_ ]+$/

function validRoomCode(roomCode) {
  if(!roomCode || !roomRegex.test(roomCode)) return false;
  return true;
}

function roomExists(roomCode) {
  if(!validRoomCode(roomCode)) return false;
  return activeRooms.includes(roomCode);
}

function createRoom(roomCode) {
  if(!validRoomCode(roomCode) || roomExists(roomCode)) return false;
  activeRooms.push(roomCode);
  return true;
}

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/create/:roomCode', (req, res) => {
  console.log(req.params);
  let roomCode = req.params.roomCode;
  if(!validRoomCode(roomCode)) res.redirect('/?error=invalidroomcode');
  else if(roomExists(roomCode)) res.redirect('/join/'+roomCode);
  else {
    createRoom(roomCode);
    res.render("game", {roomCode: roomCode});
    // res.sendFile(join(__dirname, 'index.html'));
  }
});

app.get('/join/:roomCode', (req, res) => {
  console.log(req.params);
  let roomCode = req.params.roomCode;
  if(!roomExists(roomCode)) res.redirect('/?error=roomnotfound');
  else res.render("game", {roomCode: roomCode});
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

io.on('connection', (socket) => {

 
  socket.on('enter room', (msg) => {
    socket.emit("Entered room");
  })

  socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
  });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});