const tutorController = function($scope, $http, $routeParams, $interval, $location, $window, $document) {
  
  const pingIntervalInMilliseconds = 15 * 1000; // 15 seconds

  $scope.room = {
    room: $routeParams.room.toUpperCase(),
    learners: [],
    beep: true // Kick off ability to play hand-up beep
  };

  $scope.url = new URL('/' + $scope.room.room, $location.absUrl()).href;

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
    $scope.room.learners.forEach(learner => {
      learner.status = "";
      learner.handUpRank = undefined;
    });

    // Then do it in the server too
    const roomCode = $routeParams.room;
    socket.emit('clear', roomCode);
  }

  $scope.resetRoom = function () {
    // Reset room in browser first
    $scope.room.learners = [];

    // Then do it in the server too
    const roomCode = $routeParams.room;
    socket.emit('reset', roomCode);
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

  // When user comes back to this page in browser, send in case connection lost in meantime
  $document[0].addEventListener('visibilitychange', function() {
    if (!$document[0].hidden) {
      sendPing();
    }
  })

  $scope.$on('$destroy', function() {
    socket.off('refresh-tutor');
    $document[0].removeEventListener('visibilitychange');
    if (pingTimer) {
      $interval.cancel(pingTimer);
      pingTimer = undefined;
    }
  });
};

app.controller('tutor-controller', tutorController);