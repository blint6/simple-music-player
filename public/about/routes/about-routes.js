'use strict';

angular.module('music-player.about')

.config(['$stateProvider',
    function ($stateProvider) {
        $stateProvider
            .state('about', {
                url: '/about',
                templateUrl: 'about/views/index.html'
            });
}]);
