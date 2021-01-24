app.config(function($routeProvider) {
  $routeProvider
  .when("/settings", {
    templateUrl : "pages/settings.html",
    controller: "settings"
  })
  .when("/:room/tutor", {
    templateUrl : "pages/tutor.html",
    controller: "tutor-controller"
  })
  .when("/:room", {
    templateUrl : "pages/learner.html",
    controller: "learner-controller"
  })
  .otherwise({
    templateUrl : "pages/intro.html",
    controller: 'intro-controller'
  })
});