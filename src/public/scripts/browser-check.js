const browserCheckController = function ($scope, $window) {
  $window.document.title = "Browser Check";
  $scope.message = "Browser Check";
}

app.controller('browser-check', browserCheckController);