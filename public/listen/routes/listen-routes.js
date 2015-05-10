'use strict';

angular.module('music-player.listen')

.config(['$stateProvider', '$anchorScrollProvider',
    function ($stateProvider, $anchorScrollProvider) {
        $anchorScrollProvider.disableAutoScrolling();

        $stateProvider
            .state('listen', {
                url: '/listen',
                templateUrl: 'listen/views/index.html',
                abstract: true
            })
            .state('listen.home', {
                url: '/home',
                templateUrl: 'listen/views/kind.html',
                controller: 'KindCtrl'
            })
            .state('listen.kind', {
                url: '/:kind',
                templateUrl: 'listen/views/kind.html',
                controller: 'KindCtrl'
            })
            .state('listen.kind_track', {
                url: '/:kind/t/:track',
                templateUrl: 'listen/views/kind.html',
                controller: 'KindCtrl'
            })
            .state('listen.kind_track_query', {
                url: '/:kind/t/:track/q/:query',
                templateUrl: 'listen/views/kind.html',
                controller: 'KindCtrl'
            })
            .state('listen.track-create', {
                url: '/track/create',
                templateUrl: 'listen/views/track-edit.html',
                controller: 'TrackEditCtrl'
            })
            .state('listen.track-create-continue', {
                url: '/track/create/continue',
                templateUrl: 'listen/views/track-edit.html',
                controller: 'TrackEditCtrl',
                data: {
                    keepData: true
                }
            })
            .state('listen.track-edit', {
                url: '/track/:track/edit',
                templateUrl: 'listen/views/track-edit.html',
                controller: 'TrackEditCtrl'
            })
            .state('listen.kind-create', {
                url: '/kind/create',
                templateUrl: 'listen/views/kind-edit.html',
                controller: 'KindNewCtrl'
            });
}]);
