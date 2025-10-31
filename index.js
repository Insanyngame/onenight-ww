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
var rooms = {};
const roomRegex = /^[A-Z0-9]{5}$/
const userRegex = /^[a-zA-Z0-9_ ]+$/

function randomString(stringSize) {
  let str = "";
  for(let i = 0; i < stringSize; i++) {
    let random = Math.floor(Math.random()*(26+10));
    let char;
    if(random < 10) char = 48+random;
    else if(random < 36) char = 65+(random-10);
    str += String.fromCharCode(char);
  }

  return str;
}

function validUsername(username) {
  if(!username || !userRegex.test(username)) return false;
  return true;
}

function validRoomCode(roomCode) {
  if(!roomCode || !roomRegex.test(roomCode)) return false;
  return true;
}

function roomExists(roomCode) {
  if(!validRoomCode(roomCode)) return false;
  return activeRooms.includes(roomCode);
}

function createRoom() {
  let roomCode = randomString(5);
  while(roomExists(roomCode)) {
    roomCode = randomString(5);
  }
  activeRooms.push(roomCode);
  rooms[roomCode] = [];
  return roomCode;
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

app.get('/room/:roomCode', (req, res) => {
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
  socket.on('create room', (msg) => {
    let roomCode = createRoom();
    let username = msg.username;

    console.log('criando sala '+roomCode);
    socket.emit('join room', {username: username, roomCode: roomCode});
  });
 
  socket.on('enter room', (msg) => {
    if(!validUsername(msg.username) || !roomExists(msg.roomCode)) {
      socket.emit("redirect", "/");
      return;
    }
    if(rooms[msg.roomCode].includes(msg.username)) {
      socket.emit("redirect", "/?error=usernameexists");
      return;
    }

    socket.join(msg.roomCode);
    io.to(msg.roomCode).emit("joined room", msg.username);
    rooms[msg.roomCode].push(msg.username);

    socket.emit("success enter");
    console.log("entrouu");
  })

  socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
  });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});