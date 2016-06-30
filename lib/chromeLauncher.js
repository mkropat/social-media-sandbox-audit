'use strict';

let child_process = require('child_process');

let chromeRemote = require('chrome-remote-interface');

let chromeController = require('./chromeController');
let promises = require('./promises');

function launch() {
    let args = Array.prototype.slice.call(arguments);

    args.unshift('--remote-debugging-port=9222');

    return runChrome(args)
        .then(() => promises.retryOnFailure(connectChromeDebugger, 3, 1000))
        .then(c => chromeController(c));
}

function runChrome(args) {
    return exec(`start chrome ${args.join(' ')}`)
        .catch(() => exec(`open -a "Google Chrome" --args ${args.join(' ')}`))
        .catch(() => exec(`google-chrome ${args.join(' ')}`))
        .catch(() => exec(`chromium-browser ${args.join(' ')}`));
}

function exec(command) {
    return new Promise((res, rej) => {
        child_process.exec(command, err => {
            if (err) {
                rej(err);
            }
            else {
                res();
            }
        });
    });
}

function connectChromeDebugger() {
    return chromeRemote()
        .catch(e => Promise.reject('Connecting to Chrome... ' + e.toString()));
}

module.exports = {
    launch: launch
};
