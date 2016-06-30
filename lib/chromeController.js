'use strict';

let chromeRemote = require('chrome-remote-interface');

let PageNavigator = require('./PageNavigator');
let RequestListener = require('./RequestListener');

class ChromeController {
    constructor(connection) {
        this.connection = connection;

        this._navigator = new PageNavigator(connection);
        this._requestListener = new RequestListener(connection);
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
    return chromeRemote.List()
        .then(tabs => {
            let ps = tabs.map(t => chromeRemote.Close({ id: t.id }));
            return Promise.all(ps);
        });
}

function newChrome(connection) {
    connection.DOM.enable();
    connection.Network.enable();
    connection.Page.enable();

    return new Promise(res => connection.once('ready', res))
        .then(() => new ChromeController(connection));
}

module.exports = newChrome;
