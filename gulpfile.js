// // NB: This file is no loger needed.
// // I've switched from trying to "cache-bust" the CSS and JS files
// // to just making express deliver the static files with no caching
// // - so we can update these files and have the new versions flow
// // to user's browsers OK.

// var gulp = require('gulp');
// var del = require('del');
// var sourcemaps = require('gulp-sourcemaps');
// var debug = require('gulp-debug');
// var CacheBuster = require('gulp-cachebust');
// const { dest } = require('gulp');
// var cachebust = new CacheBuster();

// // Cleans the dist output

// gulp.task('clean-public', async function () {
//     await del([
//         'dist/public'
//     ]);
// });

// // Prepare cache-busting for the resources (css and js files)

// // Use this order: 1) other assets, 2) CSS files 3) HTML files 4) JS files
// gulp.task('cache-bust-and-rewrite-public', function() {
//     return gulp.src(['src/public/**/*/!(*.html|*.css|*.js)', 'src/public/**/*/*.css', 'src/public/**/*/*.html', 'src/public/**/*.js'])
//         .pipe(cachebust.resources())
//         .pipe(cachebust.references())
//         .pipe(dest('dist/public'));
// });

// gulp.task('rewrite-index', function() {
//     return gulp.src('src/public/index.html')
//         .pipe(cachebust.references())
//         .pipe(gulp.dest('dist/public'));
// });

// // Copy node application across

// gulp.task('copy-nodejs', function() {
//     return gulp.src(['src/*.js', 'package.json'])
//     .pipe(gulp.dest('dist'));
// });

// // Rebuild of public folder

// gulp.task('public-build', gulp.series('clean-public', 'cache-bust-and-rewrite-public', 'rewrite-index'));

// // Full build

// gulp.task('build', gulp.series('public-build', 'copy-nodejs'));

// // Watch files in the src directory: if they change, rebuild the dist folder

// gulp.task('watch', function() {
//     gulp.watch('src/*.js', gulp.series('copy-nodejs'));
//     gulp.watch('src/public/**/*', gulp.series('public-build'));
// });