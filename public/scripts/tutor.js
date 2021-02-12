const tutorController = function($scope, $http, $routeParams, $interval, $location, $window) {
  
  const pageRefreshInterval = 10 * 60 * 1000; // 10 minutes (in milliseconds)

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
    });
  });

  function forcePageRefresh() {
    $window.location.reload(true);
  }

  let timer = $interval(forcePageRefresh, pageRefreshInterval);

  $scope.$on('$destroy', function() {
    socket.off('refresh-tutor');
    if (timer) {
      $interval.cancel(timer);
      timer = undefined;
    }
  });
};

app.controller('tutor-controller', tutorController);