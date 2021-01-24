const introController = function ($scope, $location) {
  $scope.room = {};

  $scope.learner = function() {
    $location.url('/' + $scope.room.code.toUpperCase());
  };

  $scope.tutor = function() {
    $location.url('/' + $scope.room.code.toUpperCase() + '/tutor');
  };
}

app.controller('intro-controller', introController);