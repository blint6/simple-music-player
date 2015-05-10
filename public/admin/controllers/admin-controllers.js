'use strict';

angular.module('music-player.admin')

.value('env', {})

.value('roleNames', {
    'track.edit': 'Track Edit/Create',
    'track.delete': 'Track Delete',
    'user.roles': 'Manage User Roles'
})

// Admin-features menus, with state mapping
.value('adminMenus', {
    'user.roles': 'admin.roles'
})

.controller('AdminCtrl', ['$scope', '$rootScope', '$state', 'roleNames', 'adminMenus',
    function ($scope, $rootScope, $state, roleNames, adminMenus) {
        $scope.roleNames = roleNames;

        // Provide full access to admin
        var adminIndex = $rootScope.global.user.roles.indexOf('admin');

        if (adminIndex > -1) {
            $scope.menus = Object.keys(adminMenus);
        } else {
            // Take all user roles that are admin-features roles
            $scope.menus = $rootScope.global.user.roles.filter(function (role) {
                return typeof adminMenus[role] !== 'undefined';
            });
        }

        $scope.clickMenu = function (role) {
            $state.go(adminMenus[role]);
        };
    }])

.controller('RolesCtrl', ['$scope', '$http', 'roleNames',
    function ($scope, $http, roleNames) {

        $scope.roleNames = roleNames;

        $scope.findRolesByUser = function () {
            $http.get('/userroles/' + $scope.username).success(function (data) {
                $scope.userEdit = data;
                $scope.roles = {};

                for (var i = 0; i < $scope.userEdit.roles.length; i++) {
                    $scope.roles[$scope.userEdit.roles[i]] = true;
                }
            }).error(function () {
                $scope.userEdit = undefined;
                $scope.roles = undefined;
            });
        };

        $scope.changeRole = function (role) {
            var grant = !!$scope.roles[role],
                operation = grant ? 'grant' : 'revoke';

            $http.get(['', operation, $scope.userEdit.username, role].join('/')).error(function (err) {
                console.log(err);
                $scope.roles[role] = !grant;
            });
        };
}]);
