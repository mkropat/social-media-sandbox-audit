'use strict';

let EventEmitter = require('events');

let SimpleStore = require('./SimpleStore');

class RequestListener extends EventEmitter {
    constructor(chrome) {
        super();

        this.reset();

        chrome.Network.requestWillBeSent(params => {
            this._pendingRequests.push(params.requestId, params.request);
        });

        chrome.Network.responseReceived(params => {
            if (!this._pendingRequests.contains(params.requestId)) {
                return;
            }

            let request = this._pendingRequests.pop(params.requestId);

            copyProperties(params.response.requestHeaders, request.headers);

            this.emit('request-completed', request);
        });
    }

    reset() {
        this._pendingRequests = new SimpleStore();
    }
}

function copyProperties(src, dst) {
    if (src && dst) {
        Object.keys(src).forEach(k => {
            dst[k] = src[k];
        });
    }
}

module.exports = RequestListener;
