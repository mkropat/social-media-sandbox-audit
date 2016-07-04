'use strict';

let gulp = require('gulp');
let run = require('gulp-run');
let sourceStream = require('vinyl-source-stream');

let auditor = require('./lib/auditor');
let config = require('./config');

gulp.task('default', () => {
    return audit(`${timestamp()}.log`)
        .pipe(gulp.dest('./logs/raw/'))
        .pipe(run('jq -f transforms/strip.jq'))
        .pipe(gulp.dest('./logs/'));
});

function audit(filename) {
    let s = sourceStream(filename);

    auditor.audit(config)
        .then(r => s.write(JSON.stringify(r, null, 4)))
        .catch(err => console.error(err.hasOwnProperty('stack') ? err.stack : err))
        .then(() => s.end());

    return s;
}

function timestamp() {
    let d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}.${d.getHours()}:${d.getMinutes()}`;
}
