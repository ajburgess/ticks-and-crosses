const path = require('path');
const express = require('express');
const { nextTick } = require('process');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
app.use(express.json());

const activeTimeoutInMinutes = 3;  // If no comms from learner for this long, grey them out
const removalTimeoutInMinutes = 5; // If no comms from learner for this long, delete them

const db = {};

app.use('/', express.static('public'));
app.use('*', express.static('public', { index: 'index.html' }));

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

io.on('connection', function(socket) {
  function associateSocketWithTutorRoom(roomCode) {
    socket.rooms.forEach(r => {
      socket.leave(r);
    });
    socket.join(`tutor-${roomCode.toUpperCase()}`);
  }

  function associateSocketWithLearnerRoom(roomCode) {
    socket.rooms.forEach(r => {
      socket.leave(r);
    });
    socket.join(roomCode.toUpperCase());    
  }

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
    if (data.beep) {
      console.log(`beep: ${roomCode}`);
    }
  }
  
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
    associateSocketWithLearnerRoom(roomCode);
    refreshLearner(roomCode, client);
    refreshTutor(roomCode);
  })

  socket.on('join-as-tutor', (roomCode) => {
    console.log(`join-as-tutor: ${roomCode}`);
    associateSocketWithTutorRoom(roomCode);
    refreshTutor(roomCode);
  })

  socket.on('ping-from-tutor', (roomCode) => {
    console.log(`ping-from-tutor: ${roomCode}`);
    associateSocketWithTutorRoom(roomCode);
    refreshTutor(roomCode);
  })

  socket.on('clear', (roomCode) => {
    console.log(`clear: ${roomCode}`);
    associateSocketWithTutorRoom(roomCode);
    const room = getRoom(roomCode);
    for (const client in room.learners) {
      const learner = room.learners[client];
      learner.status = "";
      learner.handUpRank = undefined;
    }
    saveRoom(room);
    io.to(roomCode).emit('clear');
    refreshTutor(roomCode);
  })

  socket.on('status', (data) => {
    try {
      console.log(`status: ${JSON.stringify(data)}`);
      const { client, name, status } = data;
      const roomCode = data.room;
      associateSocketWithLearnerRoom(roomCode);
      const room = getRoom(roomCode);
      const learner = room.learners[client] || {};
      if (name != undefined) {
        learner.name = name;
      }
      if (status != undefined) {
        const oldStatus = learner.status;
        learner.status = status;
        if (learner.status == 'hand-up') {
          if (learner.status != oldStatus) {
            // If hand was already up, just leave everything alone
            // Else for new hand up, decide the rank number to show next to it
            const existingRanks = Object.values(room.learners).map(lnr => lnr.handUpRank || 0);
            if (existingRanks.length == 0) {
              learner.handUpRank = 1;
            } else {
              const maxExistingRank = Math.max(...existingRanks);
              learner.handUpRank = maxExistingRank + 1;
            }
            room.beep = true;
          }
        } else {
          learner.handUpRank = undefined;
        }
      }
      learner.lastCommunication = new Date();
      room.learners[client] = learner;
      saveRoom(room);
      refreshTutor(roomCode);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on('ping-from-learner', (data) => {
    try {
      console.log(`ping-from-learner: ${JSON.stringify(data)}`);
      const { client, name, status } = data;
      const roomCode = data.room;
      associateSocketWithLearnerRoom(roomCode);
      const room = getRoom(roomCode);
      const learner = room.learners[client] || {};
      if (name != undefined) {
        learner.name = name;
      }
      learner.lastCommunication = new Date();
      room.learners[client] = learner;
      saveRoom(room);
      refreshTutor(roomCode);
      refreshLearner(roomCode, client);
    } catch (error) {
      console.log(error);
    }
  });
});

const port = process.env.PORT || 8000;
http.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

