const gulp = require('gulp');
const babel = require('gulp-babel');

gulp.task('transpile', () => {
    return gulp.src('src/public/**/*.js')
        .pipe(babel({ presets: ['@babel/preset-env'] }))
        .pipe(gulp.dest('src/dist'));
});

gulp.task('copy-all', () => {
    return gulp.src('src/public/**/*')
        .pipe(gulp.dest('src/dist'));
});

gulp.task('default', gulp.series('copy-all', 'transpile'));

gulp.task('watch', function() {
    gulp.watch('src/public/**/*', 'default');
});