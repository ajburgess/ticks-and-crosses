const tutorController = function($scope, $http, $routeParams, $interval, $location, $window, $document) {
  
  const pingIntervalInMilliseconds = 15 * 1000; // 15 seconds

  $scope.room = {
    room: $routeParams.room.toUpperCase(),
    learners: [],
    beep: true // Kick off ability to play hand-up beep
  };

  $scope.selectedClient = null;
  $scope.settings = {
    hideLearnersWithNoStatus: false
  };

  const absUrl = $location.absUrl();
  const url = new URL('/' + $scope.room.room, absUrl);

  $scope.url = url.href;

  $scope.selectLearner = function(learner) {
    if ($scope.selectedClient != learner.client) {
      $scope.selectedClient = learner.client;
    } else {
      $scope.selectedClient = null; // select again => deselect
    }
  }

  $scope.copyUrl = function () {
    const tempInput = document.createElement("input");
    tempInput.style = "position: absolute; left: -1000px; top: -1000px";
    tempInput.value = $scope.url;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
  }

  $scope.clearStatus = function () {
    // Clear status in browser first
    for (let i = 0; i < $scope.room.learners.length; i++) {
      const learner = $scope.room.learners[i];
      learner.status = "";
      learner.handUpRank = undefined;
    }

    $scope.selectedClient = null;

    // Then do it in the server too
    const roomCode = $routeParams.room;
    socket.emit('clear', roomCode);
  }

  $scope.kickSelectedLearner = function() {
    if ($scope.selectedClient) {
      socket.emit('kick-learner', $routeParams.room, $scope.selectedClient);
      $scope.selectedClient = null;
    }
  }

  $scope.kickAllLearners = function() {
    socket.emit('kick-all-learners', $routeParams.room);
    $scope.selectedClient = null;
  }

  $window.document.title = "Tutor - " + $scope.room.room;

  // Register as a tutor
  socket.emit('join-as-tutor', $routeParams.room);

  socket.on('refresh-tutor', function(data) {
    $scope.$applyAsync(function() {
      $scope.room = data;
      if (data.beep) {
        const beep = new Audio("/sounds/beep.wav");
        beep.play();
      }
    });
  });

  function sendPing() {
    socket.emit("ping-from-tutor", $routeParams.room)
  }

  let pingTimer = $interval(sendPing, pingIntervalInMilliseconds);

  function onVisibilityChange() {
    if (!$document[0].hidden) {
      sendPing();
    }
  }

  // When user comes back to this page in browser, send in case connection lost in meantime
  $document[0].addEventListener('visibilitychange', onVisibilityChange);

  $scope.$on('$destroy', function() {
    socket.off('refresh-tutor');
    $document[0].removeEventListener('visibilitychange', onVisibilityChange);
    if (pingTimer) {
      $interval.cancel(pingTimer);
      pingTimer = undefined;
    }
  });
};

app.controller('tutor-controller', tutorController);