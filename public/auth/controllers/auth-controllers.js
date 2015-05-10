'use strict';

angular.module('music-player.auth')

.controller('LoginCtrl', ['$scope', '$rootScope', '$http', '$location', 'env', 'adminMenus',
    function ($scope, $rootScope, $http, $location, env, adminMenus) {

        function loginSuccess(user) {
            $scope.loginError = 0;
            $rootScope.$emit('loggedin', user);
        }

        // This object will be filled by the form
        $scope.user = {};
        $scope.global = $rootScope.global;

        if (env.isBackendActive) {
            $scope
                .login = function () {
                    $location.url('/');
                    $http.post('/login', {
                        email: $scope.user.email,
                        password: $scope.user.password
                })
                .success(loginSuccess)
                .error(function () {
                    $scope.loginerror = 'Authentication failed.';
                });
            };
        } else {
            loginSuccess({
                name: 'Guest',
                email: $scope.user.email,
                username: $scope.user.email,
                roles: ['authenticated', 'admin']
            });
        }

        $scope.hasAdminFeatures = function () {
            if (!$rootScope.global.authenticated) {
                return false;
            }

            for (var menu in adminMenus) {
                if ($rootScope.global.hasRole(menu)) {
                    return true;
                }
            }

            return false;
        };
    }])

.controller('RegisterCtrl', ['$scope', '$rootScope', '$http', '$location',
    function ($scope, $rootScope, $http, $location) {
        $scope.user = {};

        $scope.register = function () {
            $scope.usernameError = null;
            $scope.registerError = null;
            $http.post('/register', {
                email: $scope.user.email,
                password: $scope.user.password,
                confirmPassword: $scope.user.confirmPassword,
                username: $scope.user.username,
                name: $scope.user.name
            })
                .success(function (user) {
                    // authentication OK
                    $scope.registerError = 0;
                    $rootScope.$emit('loggedin', user);
                    $location.url('/');
                })
                .error(function (error) {
                    // Error: authentication failed
                    if (error === 'Username already taken') {
                        $scope.usernameError = error;
                    } else {
                        $scope.registerError = error;
                    }
                });
        };
    }])

.directive('loginBanner', function () {
    return {
        restrict: 'E',
        templateUrl: 'auth/views/login-banner.html',
        controller: 'LoginCtrl'
    };
});
