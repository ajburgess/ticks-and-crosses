const path = require('path');
const express = require('express');
const { nextTick } = require('process');
const app = express();
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

app.post('/api/status/clear', async (req, res, next) => {
  try {
    const roomCode = req.body.room;
    const room = getRoom(roomCode);
    for (const client in room.learners) {
      const learner = room.learners[client];
      learner.status = "";
      learner.handUpRank = undefined;
    }
    saveRoom(room);
    getStatus(roomCode, res);
  } catch (error) {
    next(error);
  }
});

app.post('/api/status/reset', async (req, res, next) => {
  try {
    const roomCode = req.body.room;
    const room = getRoom(roomCode);
    for (const client in room.learners) {
      delete room.learners[client];
    }
    saveRoom(room);
    getStatus(roomCode, res);
  } catch (error) {
    next(error);
  }
});

app.post('/api/status', async (req, res, next) => {
  try {
    const { client, name, status } = req.body;
    const room = getRoom(req.body.room);
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

    res.json({
      client: client,
      room: room.code,
      name: learner.name,
      status: learner.status
    });
  } catch (error) {
    next(error);
  }
});

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

function getStatus(roomCode, res) {
    const room = getRoom(roomCode);
    const beep = room.beep;
    delete room.beep;
    tidyRoom(room);
    res.json({
      room: room.code,
      beep: beep,
      learners: Object.values(room.learners).filter(l => l.name).sort(compareLearners)
    });
}

app.get('/api/status/:room', async (req, res, next) => {
  try {
    const roomCode = req.params.room;
    getStatus(roomCode, res);
  } catch (error) {
    next(error);
  }
});

app.get('/api/status/:room/:client', async (req, res, next) => {
  try {
    const client = req.params.client;
    const room = getRoom(req.params.room);
    const learner = room.learners[client] || {};
    res.json({
      room: room.code,
      client: client,
      name: learner.name || "",
      status: learner.status || ""
    });
  } catch (error) {
    next(error);
  }
});

app.use('/', express.static('public'));
app.use('*', express.static('public', { index: 'index.html' }));

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
})