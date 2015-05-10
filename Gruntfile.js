'use strict';

module.exports = function (grunt) {

    if (process.env.NODE_ENV !== 'production') {
        require('time-grunt')(grunt);
    }

    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        assets: require('./server/config/assets.js'),
        watch: {
            js: {
                files: ['*.js', 'server/**/*.js', 'public/**/*.js', 'test/**/*.js'],
                tasks: ['jshint'],
                options: {
                    livereload: true
                }
            },
            html: {
                files: ['public/**/views/**', 'server/views/**'],
                options: {
                    livereload: true
                }
            },
            css: {
                files: ['public/**/css/**'],
                tasks: ['csslint'],
                options: {
                    livereload: true
                }
            }
        },
        jshint: {
            all: {
                src: ['*.js', 'server/**/*.js', 'public/**/*.js', 'test/**/*.js', '!test/coverage/**/*.js', '!public/system/lib/**', '!public/system/ngtemplates.js'],
                options: {
                    jshintrc: true
                }
            }
        },
        uglify: {
            options: {
                mangle: false
            },
            production: {
                files: '<%= assets.dist.js %>'
            }
        },
        csslint: {
            options: {
                csslintrc: '.csslintrc'
            },
            all: {
                src: ['public/**/css/**/*', '!public/system/lib/**']
            }
        },
        cssmin: {
            combine: {
                files: '<%= assets.dist.css %>'
            }
        },
        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd: 'public/',
                    src: ['*/views/*.html', '*/assets/**', '!*/assets/css', 'bundle/**'],
                    dest: 'dist/'
                }, {
                    expand: true,
                    cwd: 'public/',
                    src: ['*.*'],
                    dest: 'dist/',
                    filter: 'isFile'
                }, {
                    expand: true,
                    cwd: 'public/system/lib/bootstrap/dist/',
                    src: ['fonts/**'],
                    dest: 'dist/bundle/'
                }]
            },
        },
        clean: ['dist'],
        nodemon: {
            dev: {
                script: 'server.js',
                options: {
                    args: [],
                    ignore: ['public/**'],
                    ext: 'js,html',
                    nodeArgs: ['--debug'],
                    delayTime: 1,
                    env: {
                        PORT: require('./server/config/config').port
                    },
                    cwd: __dirname
                }
            },
            prod: {
                script: 'server.js',
                options: {
                    args: [],
                    ignore: ['public/**'],
                    ext: 'js,html',
                    delayTime: 1,
                    env: {
                        PORT: require('./server/config/config').port
                    },
                    cwd: __dirname
                }
            }
        },
        concurrent: {
            mean: {
                tasks: ['nodemon:dev', 'watch'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },
        mochaTest: {
            options: {
                reporter: 'spec',
                require: 'server.js'
            },
            src: ['test/mocha/**/*.js']
        },
        env: {
            test: {
                NODE_ENV: 'test'
            }
        },
        karma: {
            unit: {
                configFile: 'test/karma/karma.conf.js'
            }
        },
        shell: {
            mongodb: {
                command: 'mongod --dbpath ./data/db',
                options: {
                    async: true,
                    stdout: false,
                    stderr: true,
                    failOnError: true,
                    execOptions: {
                        cwd: '.'
                    }
                }
            }
        },
    });

    //Load NPM tasks
    require('load-grunt-tasks')(grunt);
    grunt.loadNpmTasks('grunt-contrib-copy', 'grunt-contrib-clean');

    //Making grunt default to force in order not to break the project.
    grunt.option('force', true);

    //Default task(s).
    if (process.env.NODE_ENV === 'production') {
        grunt.registerTask('default', ['production', 'nodemon:prod']);
    } else {
        grunt.registerTask('default', ['jshint', 'csslint', 'concurrent:mean']);
    }

    // Test task.
    grunt.registerTask('test', ['env:test', 'mochaTest', 'karma:unit']);

    // Production task.
    grunt.registerTask('production', ['jshint', 'csslint', 'clean', 'cssmin', 'copy', 'uglify']);

    // Mongo task.
    grunt.registerTask('mongo', ['shell:mongodb']);

    // For Heroku users only.
    // Docs: https://github.com/linnovate/mean/wiki/Deploying-on-Heroku
    grunt.registerTask('heroku:production', ['jshint', 'csslint', 'cssmin', 'uglify']);

};
