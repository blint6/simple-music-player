'use strict';

//Setting up route
angular.module('music-player.auth')

.config(['$stateProvider',
    function ($stateProvider) {
        //================================================
        // Check if the user is not conntect
        //================================================
        var checkLoggedOut = function ($q, $timeout, $http, $location) {
            // Initialize a new promise
            var deferred = $q.defer();

            // Make an AJAX call to check if the user is logged in
            $http.get('/loggedin').success(function (user) {
                // Authenticated
                if (user !== '0') {
                    $timeout(function () {
                        deferred.reject();
                    }, 0);
                    $location.url('/login');

                }

                // Not Authenticated
                else {
                    $timeout(deferred.resolve, 0);

                }
            });

            return deferred.promise;
        };
        //================================================

        // states for my app
        $stateProvider
            .state('auth', {
                templateUrl: 'auth/views/index.html'
            })
            .state('auth.login', {
                url: '/login',
                templateUrl: 'auth/views/login.html',
                resolve: {
                    loggedin: checkLoggedOut
                }
            })
            .state('auth.register', {
                url: '/register',
                templateUrl: 'auth/views/register.html',
                resolve: {
                    loggedin: checkLoggedOut
                }
            });
    }
])

.run(['$rootScope',
    function ($rootScope) {
        $rootScope.global = $rootScope.global || {};

        if (window.user && !$rootScope.global.authenticated) {
            $rootScope.global.authenticated = true;
            $rootScope.global.user = window.user;
        }

        $rootScope.global.hasRole = function (role) {
            return $rootScope.global.authenticated && ($rootScope.global.user.roles.indexOf(role) > -1 || $rootScope.global.user.roles.indexOf('admin') > -1);
        };

        $rootScope.$on('loggedin', function (event, val) {
            window.user = val;
            $rootScope.global.authenticated = !!val;
            $rootScope.global.user = val;
        });
}]);
