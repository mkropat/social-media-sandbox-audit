'use strict';

let child_process = require('child_process');
let chromeRemote = require('chrome-remote-interface');
let os = require('os');

let chromeController = require('./chromeController');
let promises = require('./promises');

function launch() {
    let args = Array.prototype.slice.call(arguments);

    args.unshift('--remote-debugging-port=9222');

    return runChrome(args)
        .then(closeFunc => {
            return promises.retryOnFailure(connectChromeDebugger, 3, 1000)
                .then(c => chromeController(c, closeFunc));
        });
}

let platformChromeRunners = {
    'darwin': function (args) {
        return exec(`open -a "Google Chrome" --args ${args.join(' ')}`)
            .then(proc => () => exec('pkill "Google Chrome"'));
    },
    'win32': function (args) {
        return exec(`start chrome ${args.join(' ')}`)
            .then(proc => () => Promise.resolve());
    }
};

function runChrome(args) {
    let platformRunner = platformChromeRunners[os.platform()];
    return platformRunner
        ? platformRunner(args).catch(() => runChromeGeneric(args))
        : runChromeGeneric(args);
}

function runChromeGeneric(args) {
    return exec(`google-chrome ${args.join(' ')}`)
        .catch(() => exec(`chromium-browser ${args.join(' ')}`))
        .then(proc => () => {
            return Promise.resolve()
                .then(proc.kill.bind(proc));
        });
}

function exec(command) {
    return new Promise((res, rej) => {
        let proc = child_process.exec(command, err => {
            if (err) {
                rej(err);
            }
            else {
                res(proc);
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
