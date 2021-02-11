const path = require('path');
const express = require('express');
const { nextTick } = require('process');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
app.use(express.json());

const activeTimeoutInMinutes = 30;      // 30 minutes
const removalTimeoutInMinutes = 60 * 8; // 8 hours

const db = {};

function getRoom(code) {
  code = code.toUpperCase();
  return db[code] || {
    code: code,
    learners: {}
  };
}

function saveRoom(room) {
  db[room.code] = room;
}

function tidyRoom(room) {
  for (const client in room.learners) {
    const learner = room.learners[client];
    const minutesSinceLastCommunication = Math.trunc((new Date() - learner.lastCommunication) / 1000 / 60);
    if (minutesSinceLastCommunication >= removalTimeoutInMinutes) {
      delete room.learners[client];
    } else {
      learner.isActive = (minutesSinceLastCommunication < activeTimeoutInMinutes);
    }
  };
  saveRoom(room);
}

function compareLearners(a, b) {
  // if (a.isActive != b.isActive) {
  //   return a.isActive? -1  : +1;
  // }
  if (a.name.toLowerCase() != b.name.toLowerCase()) {
    return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : +1;
  } else {
    return 0;
  }
}

app.use('/', express.static('public'));
app.use('*', express.static('public', { index: 'index.html' }));

function refreshTutor(roomCode) {
  const room = getRoom(roomCode);
  const beep = room.beep;
  delete room.beep;
  tidyRoom(room);
  const data = {
    room: room.code,
    beep: beep,
    learners: Object.values(room.learners).filter(l => l.name).sort(compareLearners)
  };
  io.to(`tutor-${roomCode}`).emit('refresh-tutor', data);
}

io.on('connection', function(socket) {
  function refreshLearner(roomCode, client) {
    const room = getRoom(roomCode);
    const learner = room.learners[client] || {};
    data = {
      room: room.code,
      client: client,
      name: learner.name || "",
      status: learner.status || ""
    };
    socket.emit('refresh-learner', data);
  }

  socket.on('join-as-learner', (roomCode, client) => {
    console.log(`join-as-learner: ${roomCode} - ${client}`);
    socket.rooms.forEach(r => {
      socket.leave(r);
    });
    socket.join(roomCode);
    refreshLearner(roomCode, client);
  })

  socket.on('join-as-tutor', (roomCode) => {
    console.log(`join-as-tutor: ${roomCode}`);
    socket.rooms.forEach(r => {
      socket.leave(r);
    });
    socket.join(`tutor-${roomCode}`);
    refreshTutor(roomCode);
  })

  socket.on('clear', (roomCode) => {
    console.log(`clear: ${roomCode}`);
    const room = getRoom(roomCode);
    for (const client in room.learners) {
      const learner = room.learners[client];
      learner.status = "";
      learner.handUpRank = undefined;
    }
    saveRoom(room);
    io.to(roomCode).emit('clear'); // SOCKETS
    refreshTutor(roomCode);
  })

  socket.on('status', (data) => {
    try {
      console.log(`status: ${JSON.stringify(data)}`);
      const { client, name, status } = data;
      const room = getRoom(data.room);
      const learner = room.learners[client] || {};
      if (name != undefined) {
        learner.name = name;
      }
      learner.handUpRank = undefined;
      if (status != undefined) {
        learner.status = status;
        if (learner.status == 'hand-up') {
          const existingRanks = Object.values(room.learners).map(lnr => lnr.handUpRank || 0);
          if (existingRanks.length == 0) {
            learner.handUpRank = 1;
          } else {
            const maxExistingRank = Math.max(...existingRanks);
            learner.handUpRank = maxExistingRank + 1;
          }
          room.beep = true;
        }
      }
      learner.lastCommunication = new Date();
      room.learners[client] = learner;
      saveRoom(room);
      refreshTutor(room.code);
    } catch (error) {
      console.log(error);
    }
  });
});

const port = process.env.PORT || 8000;
http.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

