app.controller('settings', function ($scope, $localStorage) {
  // Store settings in local storage
  $scope.settings = $localStorage;
  
  // Set defaults for all settings
  $scope.settings.useSession ||= false;
});