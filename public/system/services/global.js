'use strict';

//Global service for global variables
angular.module('music-player.system')

.factory('Global', [

    function () {
        var _this = this;
        _this._data = {
            user: window.user,
            authenticated: !!window.user
        };
        return _this._data;
    }
])

.factory('fileUpload', ['$http',
    function ($http) {
        return function (uploadUrl, files, data) {
            var fd = new FormData();

            if (data) {
                for (var d in data) {
                    fd.append(d, data[d]);
                }
            }

            if (files) {
                for (var f in files) {
                    fd.append(f, files[f]);
                }
            }

            return $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': undefined
                }
            });
        };
    }
])

.directive('fileModel', ['$parse',
    function ($parse) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var model = $parse(attrs.fileModel);
                var modelSetter = model.assign;

                element.bind('change', function () {
                    scope.$apply(function () {
                        modelSetter(scope, element[0].files[0]);
                    });
                });
            }
        };
    }
]);
