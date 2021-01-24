const tutorController = function($scope, $http, $routeParams, $interval, $location, $window) {
  function refresh() {
    console.log('refresh...');
    const code = $routeParams.room;
    const url = `/api/status/${code}`;
    $http({url: url, method: 'GET'})
    .then(function (response) {
      $scope.room = response.data;
    });
  }

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
    const url = `/api/status/clear`;
    const data = { room: $routeParams.room };
    $http.post(url, data).then(function (response) {
      $scope.room = response.data;
    });
  }

  $scope.refresh = refresh;

  $window.document.title = "Tutor - " + $scope.room.room;

  let timer = $interval(refresh, 1000);

  $scope.$on('$destroy', function() {
    if (timer) {
      $interval.cancel(timer);
      timer = undefined;
    }
  });
};

app.controller('tutor-controller', tutorController);