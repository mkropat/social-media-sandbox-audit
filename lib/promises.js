'use strict';

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function retryOnFailure(action, times, delay_ms) {
    if (times === undefined) {
        times = 1;
    }

    if (delay_ms === undefined) {
        delay_ms = 100;
    }

    return run();

    function run() {
        times--;
        return times < 0
            ? action()
            : action().catch(() => delay(delay_ms).then(run));
    }
}

function runSequentially(promiseFactories) {
    if (!promiseFactories.length) {
        return Promise.resolve([]);
    }

    let queue = promiseFactories.slice();
    let current = queue.shift();

    return current().then(r => {
        return runSequentially(queue)
            .then(rs => {
                rs.unshift(r);
                return rs;
            });
    });
}

module.exports = {
    delay: delay,
    retryOnFailure: retryOnFailure,
    runSequentially: runSequentially
};
