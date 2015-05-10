'use strict';

angular.module('music-player.listen')

.value('CLIENT_ID', '1c21814089b72a7cd4ce9246009ddcfb')

// Player
.factory('PlayerService', ['$rootScope', 'audio', 'storage', 'CLIENT_ID',
    function ($rootScope, audio, storage, CLIENT_ID) {
        var player,
            i;

        player = {
            tracks: undefined,
            playing: false,
            paused: true,
            stopped: true,

            play: function () {

                if (player.stopped || !player.paused) {
                    audio.src = player.playing.streamUrl + '?client_id=' + CLIENT_ID;
                }
                audio.play();
                player.paused = false;
                player.stopped = false;

                var playCount = storage.get('playCount');
                if (playCount === 1000) alert('holy fucking shit you\'ve listened to 1,000 microbeats you are awesome i will buy you a drink and give you lots of hugs');
                if (playCount === 2000) alert('2,000 plays you are awesome if we are not friends why are we not friends you are probably really rad');
                playCount = playCount + 1;
                storage.set('playCount', playCount);
            },

            pause: function () {
                if (!player.paused) {
                    audio.pause();
                    player.paused = true;
                }
            },
            stop: function () {
                player.pause();
                player.stopped = true;
            },
            next: function () {
                if (typeof i === 'number') {
                    if (i < player.tracks.length - 1) {
                        player.setTrack(player.tracks[i + 1]);
                        player.play();
                    } else {
                        player.stop();
                    }
                } else {
                    player.play();
                }
            },
            previous: function () {
                if (typeof i === 'number') {
                    if (i > 0) {
                        player.setTrack(player.tracks[i - 1]);
                        player.play();
                    }
                } else {
                    player.play();
                }
            },
            setTracks: function (tracks, track) {
                player.tracks = tracks;
                player.setTrack(track);
            },
            setTrack: function (track) {
                if (player.tracks.length === 0) {
                    return;
                }

                if (typeof track !== 'undefined') {

                    // Find track in playlist
                    for (i = 0; i < player.tracks.length && player.tracks[i].title !== track.title; i++);

                    if (i < player.tracks.length) {
                        player.playing = player.tracks[i];
                    } else {
                        i = -1;
                    }
                } else if (player.playing) {
                    return player.setTrack(player.playing);
                } else {
                    return player.setTrack(player.tracks[0]);
                }
            },
        };
        audio.addEventListener('ended', function () {
            $rootScope.$apply(player.next());
        }, false);
        return player;
}])

/**
 * The current resouce service stores a data being handled in some controller in order to fetch it back when needed
 */
.factory('currentResource', ['$q',
    function ($q) {
        var _resource = {};

        return function (id) {
            return {
                // If cb given, get the value from it if resource undefined
                get: function (cb) {
                    if (cb && typeof _resource[id] === 'undefined') {
                        return $q.when(cb()).then(function (data) {
                            _resource[id] = data;
                            return data;
                        });
                    }

                    return $q.when(_resource[id]);
                },
                set: function (track) {
                    _resource[id] = track;
                },
                unset: function () {
                    delete _resource[id];
                }
            };
        };
}])

/**
 * The paginator
 */
.factory('paginate', function () {
    var pageBase = 8,
        pageInterval = 4;
    var Paginate = function (cb) {
        this._index = pageBase;
        this._cb = cb;
        this._stop = false;
    };

    Paginate.prototype.next = function (cb) {
        if (!this._stop) {
            var fetched = (cb || this._cb)(this._index, pageInterval) === false;
            this._index += fetched || pageInterval;
            this._stop = typeof fetched === 'number' && fetched === 0;
        }
    };

    return function (cb) {
        cb(0, pageBase);
        return new Paginate(cb);
    };
})

.factory('Track', ['$resource',
    function ($resource) {
        return $resource('tracks/:trackId', {
            trackId: '@_id'
        }, {
            get: {
                interceptor: {
                    response: function (response) {
                        var data = response.data,
                            parse = Date.parse(data.date);

                        if (!isNaN(parse)) {
                            data.date = new Date(parse);
                        }

                        return response;
                    }
                }
            },
            update: {
                method: 'PUT'
            }
        });
}])

.factory('TrackQuery', ['$resource',
    function ($resource) {
        return $resource('tracks/k/:kind/search', {});
}])

.factory('Kind', ['$resource',
    function ($resource) {
        return $resource('kinds/:kindId', {
            kindId: '@_id'
        }, {
            update: {
                method: 'PUT'
            }
        });
}])

// Audio Factory
.factory('audio', ['$document',
    function ($document) {
        var audio = $document[0].createElement('audio');
        return audio;
}])

// Local Storage Factory
.factory('storage', function () {
    return {
        set: function (key, obj) {
            var string = JSON.stringify(obj);
            localStorage.setItem(key, string);
        },
        get: function (key) {
            var data = localStorage.getItem(key);
            var obj = JSON.parse(data);
            return obj;
        },
        clearAll: function () {
            localStorage.clear();
        }
    };
})

.factory('scrollToId', function () {
    return function (id) {
        var trackElement = document.getElementById(id),
            scrollable = document.getElementById('scroll_tracks');

        if (typeof trackElement !== 'undefined') {
            $(scrollable).animate({
                scrollTop: trackElement.offsetParent.offsetTop
            });
        }
    };
})

// SC URL change watcher. Empty fields are auto replaced by API fetched data
.factory('trackEditScopeWatcher', ['$http', 'CLIENT_ID',
    function ($http, CLIENT_ID) {
        return function (scope) {
            var apiFields = {
                title: 'title',
                streamUrl: 'stream_url',
                artworkUrl: 'artwork_url',
            };

            scope.$watch('track.soundcloudLink', function (newValue) {
                if (newValue && newValue.match(/^https?:\/\/[^\/]*soundcloud.com/)) {
                    $http.get('http://api.soundcloud.com/resolve.json?url=' + newValue + '&client_id=' + CLIENT_ID).success(function (data) {
                        for (var f in apiFields) {
                            if (!scope.track[f]) {
                                scope.track[f] = data[apiFields[f]];
                            }
                        }

                        if (!scope.track.artist) {
                            scope.track.artist = data.user.username;
                        }
                    });
                }
            });
        };
}])

.directive('whenScrolled', function () {
    return function (scope, elm, attr) {
        var raw = elm[0];

        elm.bind('scroll', function () {
            if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                scope.$apply(attr.whenScrolled);
            }
        });
    };
})

.directive('mpTrack', function () {
    return {
        restrict: 'E',
        templateUrl: 'listen/views/track.html',
        scope: {
            trackList: '=',
            track: '=',
            query: '@',
        },
        controller: ['$scope', '$rootScope', 'PlayerService', 'currentResource',
            function ($scope, $rootScope, PlayerService, currentResource) {
                $scope.global = $rootScope.global;
                $scope.clickTrack = function (trackObj) {
                    PlayerService.setTracks($scope.trackList, trackObj);
                    PlayerService.play();

                    return currentResource('tracklistInfo').get().then(function (info) {
                        info.keepInfo = true;
                    });
                };
        }]
    };
})

.directive('mpMusicPlayer', function () {
    return {
        restrict: 'E',
        templateUrl: 'listen/views/player.html',
        scope: {},
        controller: 'PlayerCtrl'
    };
})

.filter('playTime', function () {
    return function (ms) {
        var hours = Math.floor(ms / 36e5),
            mins = '0' + Math.floor((ms % 36e5) / 6e4),
            secs = '0' + Math.floor((ms % 6e4) / 1000);
        mins = mins.substr(mins.length - 2);
        secs = secs.substr(secs.length - 2);
        if (hours) {
            return hours + ':' + mins + ':' + secs;
        } else {
            return mins + ':' + secs;
        }
    };
})

.filter('dateSimple', function () {
    return function (dateString) {
        return moment(new Date(dateString)).format('LL');
    };
});
