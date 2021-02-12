var gulp = require('gulp');
var del = require('del');
var sourcemaps = require('gulp-sourcemaps');
var debug = require('gulp-debug');
var CacheBuster = require('gulp-cachebust');
var cachebust = new CacheBuster();

/////////////////////////////////////////////////////////////////////////////////////
//
// cleans the dist output
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('clean', async function () {
    await del([
        'dist'
    ]);
});

/////////////////////////////////////////////////////////////////////////////////////
//
// Prepare cache-busting for the resources (css and js files)
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('prepare-resources', function() {
    return gulp.src('src/public/**/*.{css,js}')
        .pipe(cachebust.resources())
        .pipe(gulp.dest('dist/public'));
});

// Copy other public assets across

gulp.task('copy-public', function() {
    return gulp.src('src/public/**/*.html')
    .pipe(gulp.dest('dist/public'));
});

// Copy node application across

gulp.task('copy-node', function() {
    return gulp.src('src/*.js')
    .pipe(gulp.dest('dist'));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// Apply cache busting to the main HTML page
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('build-html', function() {
    return gulp.src('src/public/index.html')
        .pipe(cachebust.references())
        .pipe(gulp.dest('dist/public'));
});

// Full build

gulp.task('build', gulp.series('copy-node', 'copy-public', 'prepare-resources', 'build-html'));
