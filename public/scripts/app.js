const app = angular.module('app', ['ngRoute', 'ngStorage']);

app.config(function ($locationProvider) {
  $locationProvider.html5Mode(true);
});

const socket = io.connect();
