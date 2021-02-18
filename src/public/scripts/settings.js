app.controller('settings', function ($scope, $localStorage) {
  // Store settings in local storage
  $scope.settings = $localStorage;
  
  // Set defaults for all settings
  if ($scope.settings.useSession == undefined) {
    $scope.settings.useSession = false;
  }
});