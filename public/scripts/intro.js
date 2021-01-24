const introController = function ($scope, $location, $window) {
  $window.document.title = "Ticks and Crosses";
  $scope.room = {};

  $scope.learner = function() {
    $location.url('/' + $scope.room.code.toUpperCase());
  };

  $scope.tutor = function() {
    $location.url('/' + $scope.room.code.toUpperCase() + '/tutor');
  };
}

app.controller('intro-controller', introController);