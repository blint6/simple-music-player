'use strict';

var path = require('path');
var gulp = require('gulp');
var concat = require('gulp-concat');

gulp.task('concat-js', function () {
    return gulp.src(['public/**/*.js', '!public/init.js'], {
        base: 'public'
    })
        .pipe(concat('music-player.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('concat-css', function () {
    return gulp.src(['public/**/*.css', '!public/system/lib/**'], {
        base: 'public'
    })
        .pipe(concat('music-player.css'))
        .pipe(gulp.dest('dist'));
});

gulp.task('copy', function () {
    return gulp.src(['public/**', '!public/*/**/*.{js,css}'], {
        base: 'public'
    })
        .pipe(gulp.dest('dist'));
});

gulp.task('static', ['concat-js', 'concat-css', 'copy']);
