'use strict';

angular.module('music-player.listen')

.controller('PlayerCtrl', ['$scope', '$state', 'PlayerService', 'audio',
    function ($scope, $state, PlayerService, audio) {

        $scope.player = PlayerService;
        $scope.audio = audio;
        $scope.isPaused = function () {
            return PlayerService.paused;
        };

        $scope.play = PlayerService.play;
        $scope.pause = PlayerService.pause;
        $scope.previous = PlayerService.previous;
        $scope.next = PlayerService.next;
}])

.controller('NavigationCtrl', ['$scope',
    function ($scope) {
        $scope.kinds = {
            techno: {
                name: 'Electro'
            },
            house: {
                name: 'House'
            },
            drone: {
                name: 'Funk'
            },
            ambient: {
                name: 'Ambient'
            },
        };
}])

.controller('ScrubberCtrl', ['$scope', 'audio',
    function ($scope, audio) {
        $scope.currentTimeMS = 0;
        $scope.durationMS = 0;

        function updateView() {
            $scope.$apply(function () {
                $scope.currentBufferPercentage = ((audio.buffered.length && audio.buffered.end(0)) / audio.duration) * 100;
                $scope.currentTimePercentage = (audio.currentTime / audio.duration) * 100;
                $scope.currentTimeMS = (audio.currentTime * 1000).toFixed();
                $scope.durationMS = (audio.duration * 1000).toFixed();
            });
        }
        audio.addEventListener('timeupdate', updateView, false);
        $scope.seekTo = function ($event) {
            var xpos = $event.offsetX / $event.target.offsetWidth;
            audio.currentTime = (xpos * audio.duration);
        };
}])

.controller('KindCtrl', ['$scope', '$filter', '$state', '$stateParams', 'paginate', 'currentResource', 'PlayerService', 'TrackQuery',
    function ($scope, $filter, $state, $stateParams, paginate, currentResource, PlayerService, TrackQuery) {

        var _tracklistInfo = {
            lastQuery: false,
            tracks: []
        };

        var freshTracklistInfo = function () {
                var info = {
                    lastQuery: false,
                    tracks: []
                };

                if (typeof $stateParams.kind !== 'undefined') {
                    info.kind = $stateParams.kind;
                }

                return info;
            },

            // Track fetching management
            tracksHandler = function (tracks) {
                if (tracks.length > 0) {
                    for (var i = 0; i < tracks.length; i++) {
                        tracks[i].linkId = $state.href('listen.kind_track', {
                            kind: tracks[i].kind.slug,
                            track: tracks[i].trackId
                        });
                        _tracklistInfo.tracks.push(tracks[i]);
                    }
                }

                filterTracks();
            },

            filterTracks = function () {
                $scope.filteredTracks = _tracklistInfo.tracks;
            },

            resetPage = function () {
                _tracklistInfo.tracks = [];

                //$scope.page = paginate(function (skip, limit) {
                //    var params = {
                //        skip: skip,
                //        limit: limit,
                //        q: $scope.query
                //    };
                //
                //    if (_tracklistInfo.kind) {
                //        params.kind = _tracklistInfo.kind;
                //    }
                //
                //    TrackQuery.query(params, tracksHandler);
                //});
                TrackQuery.query({}, tracksHandler);
            };

        currentResource('tracklistInfo').get(freshTracklistInfo).then(function (info) {

            // Don't update tracklist if we clicked a track (URL changes, but we don't change display)
            if (info.keepInfo) {
                delete info.keepInfo;
                _tracklistInfo = info;
            } else {
                _tracklistInfo = freshTracklistInfo();
                currentResource('tracklistInfo').set(_tracklistInfo);
            }

            resetPage();
        });

        //$scope.$watch('query', function (qry) {
        //    if (qry !== undefined) {
        //        resetPage();
        //    }
        //});

        $scope.query = $stateParams.query;
        $scope.loadNextTracks = function () {
            return $scope.page.next();
        };
}])

.controller('KindNewCtrl', ['$scope', '$state', 'slugify', 'Kind',
    function ($scope, $state, slugify, Kind) {
        $scope.kind = new Kind();

        $scope.sumbit = function () {
            $scope.kind.slug = slugify($scope.kind.title);
            $scope.kind.$save().then(function () {
                $state.go('listen.track-create-continue');
            });
        };
}])

.controller('TrackEditCtrl', ['$scope', '$window', '$state', '$stateParams', '$q', 'fileUpload', 'currentResource', 'slugify', 'Kind', 'Track', 'trackEditScopeWatcher',

    function ($scope, $window, $state, $stateParams, $q, fileUpload, currentResource, slugify, Kind, Track, trackEditScopeWatcher) {

        if (!$state.current.data || !$state.current.data.keepData) {
            currentResource('track').unset();
        }

        function handleUploads(savedTrack) {
            var deferred = $q.defer(),
                promise = deferred.promise;

            if ($scope.files.artwork) {
                promise.then(function () {
                    return fileUpload('upload/artwork/' + savedTrack._id, {
                        artwork: $scope.files.artwork
                    });
                });
            }

            if ($scope.files.track) {
                promise.then(function () {
                    return fileUpload('upload/track/' + savedTrack._id, {
                        track: $scope.files.track
                    });
                });
            }

            promise.then(function (mostUpToDateTrack) {
                $scope.track = mostUpToDateTrack;
            });

            deferred.resolve(savedTrack);
            return promise;
        }

        $scope.newTrack = typeof $stateParams.track === 'undefined';
        $scope.files = {};

        $scope.submit = function () {

            $scope.track.slug = slugify($scope.track.title);

            if ($scope.newTrack) {
                $scope.track.$save()
                    .then(handleUploads)
                    .then(function () {
                        currentResource('track').unset();
                        return currentResource('track').get(function () {
                            var track = new Track();
                            track.date = new Date();
                            return track;
                        }).then(function (data) {
                            $scope.track = data;
                        });
                    });
            } else {
                $scope.track.$update()
                    .then(handleUploads)
                    .then(function () {
                        currentResource('track').unset();
                        $state.go('listen.kind', {
                            kind: $scope.track.slug
                        });
                    });
            }
        };

        $scope.delete = function () {
            if ($window.confirm('You are about to delete this track, OK?')) {
                var trackKind = $scope.track.kind;

                $scope.track.$delete().then(function () {
                    currentResource('track').unset();
                    $state.go('listen.kind', {
                        kind: trackKind.slug
                    });
                });
            }
        };

        trackEditScopeWatcher($scope);

        return $q.all(
            currentResource('track').get(function () {
                var track;

                if ($scope.newTrack) {
                    track = new Track();
                    track.date = new Date();
                    return track;
                } else {
                    track = Track.get({
                        trackId: $stateParams.track
                    });

                    return track.$promise.then(function () {
                        var parse = Date.parse(track.date);

                        if (!isNaN(parse)) {
                            track.date = new Date(parse);
                        }

                        return track;
                    });
                }
            }).then(function (data) {
                $scope.track = data;
                $scope.track.kind = $scope.kinds.length && $scope.kinds[0].slug;
            }),

            Kind.query(function (kinds) {
                $scope.kinds = kinds;
            })
        );
}])

.controller('SettingsCtrl',
    function () {

    });
