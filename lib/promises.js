'use strict';

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
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
    runSequentially: runSequentially
};
