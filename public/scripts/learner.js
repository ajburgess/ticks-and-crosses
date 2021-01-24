const learnerController = function($scope, $http, $routeParams, $localStorage, $sessionStorage, $interval, $window) {

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

  function getStatus() {
    const room = $routeParams.room;
    const client = getClient();
    const url = `/api/status/${room}/${client}`;
    return $http.get(url);
  }

  function submitStatus() {
    const url = "/api/status";
    const data = {
      client: getClient(),
      room: $routeParams.room,
      status: $scope.learner.status,
      name: $scope.learner.name
    };
    return $http.post(url, data);
  }

  function submitName() {
    nameHasChanged = false;
    const url = "/api/status";
    const data = {
      client: getClient(),
      room: $routeParams.room,
      name: $scope.learner.name
    };
    return $http.post(url, data);
  }

  $scope.send = function(status) {
    $scope.learner.status = status;
    getStorage().whenSubmitted = new Date();
    updateTimeMessage();
    $scope.failed = false;
    submitStatus().then(function(response) {
      // Nothing to do!
    }, function (error) {
      // Pause slightly before displaying failed message, to avoid flashing
      $interval(function () { $scope.failed = true }, 250, 1);
    });
  }

  function setTitle() {
    $window.document.title = ($scope.learner.name || "Learner")  + " - " + $scope.room.code;
  }

  $scope.nameChanged = function() {
    nameHasChanged = true;
    setTitle();
    getStorage().name = $scope.learner.name;    
  }

  function updateTimeMessage() {
    let whenSubmitted = getStorage().whenSubmitted;
    if (!whenSubmitted) {
      timeMessage = "";
      return;
    }
    if (typeof whenSubmitted == 'string') {
      whenSubmitted = new Date(whenSubmitted);
    }
    const secondsAgo = (new Date() - whenSubmitted) / 1000;
    if (secondsAgo < 5) {
      $scope.timeMessage = "Just now"
    } else if (secondsAgo >= 5 && secondsAgo < 60) {
      const nearest5Seconods = Math.trunc(secondsAgo / 5) * 5;
      $scope.timeMessage = `${nearest5Seconods} seconds ago`;
    } else if (secondsAgo >= 60 && secondsAgo < 60 * 60) {
      const nearestMinute = Math.trunc(secondsAgo / 60);
      $scope.timeMessage = `${nearestMinute} ${nearestMinute == 1 ? 'minute' : 'minutes'} ago`;
    } else {
      $scope.timeMessage = "More than an hour ago";
    }
  }

  $scope.room = {
    code: $routeParams.room.toUpperCase()
  };

  $scope.learner = {
    name: getStorage().name || "",
    status: ""
  };

  // In event of F5 refresh, or re-opening this page
  // re-synchronise with the server's view...
  getStatus().then(function (response) {
    $scope.room.code = response.data.room;
    $scope.learner.name = response.data.name || $scope.learner.name || "";
    $scope.learner.status = response.data.status || "";
    submitName();
    setTitle();
  });

  setTitle();

  const timer = $interval(function () {
    updateTimeMessage();
    if (nameHasChanged) {
      $scope.failed = false;
      submitName().then(function(response) {
        // Nothing to do
      }, function (error) {
        $scope.failed = true;
      });
    }
  }, 1000);

  $scope.$on('$destroy', function() {
    if (timer) {
      $interval.cancel(timer);
      timer = undefined;
    }
  });
};

app.controller('learner-controller', learnerController);