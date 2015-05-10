'use strict';

angular.module('music-player.admin')

.config(['$stateProvider',
    function ($stateProvider) {
        $stateProvider
            .state('admin', {
                templateUrl: 'admin/views/index.html'
            })
            .state('admin.menu', {
                url: '/admin',
                templateUrl: 'admin/views/menu.html'
            })
            .state('admin.roles', {
                url: '/admin/roles',
                templateUrl: 'admin/views/roles.html'
            });
}]);
