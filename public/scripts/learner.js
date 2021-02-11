const learnerController = function($scope, $http, $routeParams, $localStorage, $sessionStorage, $timeout, $window) {

  let nameHasChanged = false;

  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function getStorage() {
    return $localStorage.useSession ? $sessionStorage : $localStorage;
  }

  function getClient() {
    const storage = getStorage();
    if (storage.client == undefined) {
      storage.client = uuidv4();
    }
    return storage.client;
  }

  function submitStatus() {
    const data = {
      client: getClient(),
      room: $routeParams.room,
      status: $scope.learner.status,
      name: $scope.learner.name
    };
    socket.emit('status', data); // SOCKETS
  }

  function submitName() {
    nameHasChanged = false;
    const data = {
      client: getClient(),
      room: $routeParams.room,
      name: $scope.learner.name
    };
    socket.emit('status', data); // SOCKETS
  }

  $scope.send = function(status) {
    $scope.learner.status = status;
    submitStatus();
  }

  function setTitle() {
    $window.document.title = ($scope.learner.name || "Learner")  + " - " + $scope.room.code;
  }

  let delay = undefined;

  $scope.nameChanged = function() {
    setTitle();
    getStorage().name = $scope.learner.name;
    if (delay) {
      $timeout.cancel(delay);
    }
    delay = $timeout(submitName, 250);
  }

  $scope.room = {
    code: $routeParams.room.toUpperCase()
  };

  $scope.learner = {
    name: getStorage().name || "",
    status: ""
  };

  socket.on('clear', function() {
    $scope.$applyAsync(function() {
      $scope.learner.status = '';
    });
  });

  socket.on('refresh-learner', (data) => {
    $scope.$applyAsync(function() {
      $scope.room.code = data.room;
      $scope.learner.name = data.name || $scope.learner.name || "";
      $scope.learner.status = data.status || "";
      submitName();
      setTitle();
    });
  });

  $scope.$on('$destroy', function() {
    socket.off('refresh-learner');
    socket.off('clear');
    if (delay) {
      $timeout.cancel(delay);
      delay = undefined;
    }
  });

  // In event of F5 refresh, or re-opening this page
  // re-synchronise with the server's view...
  const roomCode = $routeParams.room;
  const client = getClient();
  socket.emit('join-as-learner', roomCode, client);
  setTitle();  
};

app.controller('learner-controller', learnerController);