'use strict';


angular.module('music-player.listen')

    .factory('MusicPlayerResourceMockFactory', ['$q', function ($q) {
        return function(StoreMock) {
            function MusicPlayerResourceMock(pojso) {
                for (var k in pojso) {
                    this[k] = pojso[k];
                }

                // Initialize requested objects (associations))
                for (var i = 1; i < arguments.length; i++) {
                    this[arguments[i]] = {};
                }
            }

            MusicPlayerResourceMock.prototype.$save = function() {
                if (this._id)
                    throw Error('Resource already saved');

                StoreMock.put(this);

                var defer = $q.defer();
                defer.resolve();
                return defer.promise;
            };

            MusicPlayerResourceMock.prototype.$update = function() {
                if (!this._id)
                    throw Error('Resource not in the store');

                // Do nothing, actually we don't care :)

                var defer = $q.defer();
                defer.resolve();
                return defer.promise;
            };

            MusicPlayerResourceMock.prototype.$delete = function() {
                if (!this._id)
                    throw Error('Resource not in the store');

                StoreMock.del(this);

                var defer = $q.defer();
                defer.resolve();
                return defer.promise;
            };

            MusicPlayerResourceMock.get = function (params) {
                var obj;

                StoreMock.get(params, function (fetchedObj) {
                    // Here is not async actually
                    obj = fetchedObj;

                    var defer = $q.defer();
                    obj.$promise = defer.promise;
                    defer.resolve();
                });

                return obj;
            };

            MusicPlayerResourceMock.query = function (params, cb) {
                if (arguments.length === 1) {
                    cb = params;
                    params = null;
                }
                StoreMock.list(cb);
            };

            return MusicPlayerResourceMock;
        };
    }])

    .factory('StoreMock', [function () {
        return function(objIdKey) {
            var objs = null, idGenerator = 1, waitingCbs = [];
            var excludedToSave = ['_id', '$$hashKey', 'object'];

            function printJson() {
                try {
                    var objsCopy = [];

                    objs.forEach(function(obj) {
                        var objCopy = {}, prop;

                        for (prop in obj) {
                            if (excludedToSave.indexOf(prop) < 0) {
                                objCopy[prop] = obj[prop];
                            }
                        }

                        objsCopy.push(objCopy);
                    });

                    console.log(JSON.stringify(objsCopy, null, '  '));
                } catch (e) {
                    console.error('Got error while printing JSON', e);
                }
            }

            return {

                get: function(params, cb) {
                    for (var i = 0; i < objs.length; i++)
                        if (objs[i]._id === params[objIdKey]) return cb(objs[i]);

                    // Not found
                    cb();
                },

                list: function (cb) {
                    if (objs === null)
                        waitingCbs.push(cb);
                    else
                        cb(objs);
                },

                put: function(obj, cb) {
                    obj._id = String(idGenerator++);
                    obj[objIdKey] = obj._id;

                    if (!objs) objs = [];
                    objs.unshift(obj);

                    printJson();
                    if (typeof cb === 'function') cb();
                },

                del: function(obj, cb) {
                    for (var i = 0; i < objs.length; i++)
                        if (objs[i]._id === obj._id) {
                            objs.splice(i, 1);
                            printJson();
                            if (typeof cb === 'function') cb();
                            return;
                        }

                    // Not found
                    if (typeof cb === 'function') cb(Errror('not found'));
                },

                resolve: function() {
                    waitingCbs.forEach(function (cb) {
                        cb(objs);
                    });
                    if (!objs) objs = [];
                    waitingCbs = null;
                }
            };
        };
    }])

    .factory('TrackStoreMock', ['StoreMock',
        function (StoreMock) {
            return StoreMock('trackId');
    }])

    .factory('KindStoreMock', ['StoreMock',
        function (StoreMock) {
            return StoreMock('kindId');
    }])

    .factory('Kind', ['MusicPlayerResourceMockFactory', 'KindStoreMock',
        function (MusicPlayerResourceMockFactory, KindStoreMock) {
            return MusicPlayerResourceMockFactory(KindStoreMock);
        }])

    .factory('Track', ['MusicPlayerResourceMockFactory', 'TrackStoreMock',
        function (MusicPlayerResourceMockFactory, TrackStoreMock) {
            return MusicPlayerResourceMockFactory(TrackStoreMock, 'kind');
        }])

    .factory('TrackQuery', ['TrackStoreMock', function (TrackStoreMock) {
        return {
            query: function (params, cb) {
                console.log('Fetching all tracks');
                TrackStoreMock.list(cb);
            }
        }
    }])

    .factory('slugify', [function () {
        return function(title) {
            return title.toLowerCase()
                .replace(/ /g, '-')
                .replace(/-+/g, '-')
                .replace(/[^\w-]/g, '');
        };
    }])

    .run(['$http', 'slugify', 'Track', 'Kind', 'TrackStoreMock', 'KindStoreMock',
        function ($http, slugify, Track, Kind, TrackStoreMock, KindStoreMock) {
            var kinds = {};

            $http
                .get('static-tracks.json')
                .success(function(tracksData) {
                    tracksData.forEach(function(rawTrack) {
                        var track = new Track(rawTrack);
                        track.date = new Date(rawTrack.date);
                        track.$save();

                        if (!kinds[track.kind]) {
                            var kind = new Kind({
                                title: track.kind
                            });

                            kinds[track.kind] = kind;

                            kind.slug = slugify(kind.title);

                            kind.$save();
                        }
                    });

                    console.log('Resolved');
                    TrackStoreMock.resolve();
                    KindStoreMock.resolve();
                });
    }])

    .filter('dateSimple', function () {
        return function (date) {
            return moment(date).format('LL');
        };
    });
