'use strict';

let child_process = require('child_process');

let ChromeRemote = require('chrome-remote-interface');

let PageNavigator = require('./PageNavigator');
let RequestListener = require('./RequestListener');

function launch() {
    let args = Array.prototype.slice.call(arguments);

    args.unshift('--remote-debugging-port=9222');

    return runChrome(args)
        .then(connectChromeDebugger())
        .then(initConnection)
        .then(c => new Chrome(c));
}

function runChrome(args) {
    return new Promise((res, rej) => {
        child_process.exec(`start chrome ${args.join(' ')}`, err => {
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
    return ChromeRemote()
        .catch(e => Promise.reject('Connecting to Chrome... ' + e.toString()));
}

function initConnection(connection) {
    connection.DOM.enable();
    connection.Network.enable();
    connection.Page.enable();

    return new Promise(res => {
        connection.once('ready', () => res(connection));
    });
}

class Chrome {
    constructor(connection) {
        this.connection = connection;

        this._navigator = new PageNavigator(this.connection);
        this._requestListener = new RequestListener(this.connection);
    }

    querySelector(selector) {
        return this.connection.Runtime.evaluate({
            expression: `document.querySelector("${selector}").href`,
            returnByValue: true
        })
            .then(r => r.result.value);
    }

    navigate(url) {
        return this._navigator.navigate(url)
            .then(() => this.connection);
    }

    requestCompleted(handler) {
        this._requestListener.on('request-completed', handler);
    }

    reset() {
        this._requestListener.reset();
    }

    close() {
        return closeAllTabs()
            .then(() => this.connection.close());
    }
}

function closeAllTabs() {
    return ChromeRemote.List()
        .then(tabs => {
            let ps = tabs.map(t => ChromeRemote.Close({ id: t.id }));
            return Promise.all(ps);
        });
}

module.exports = {
    launch: launch
};
