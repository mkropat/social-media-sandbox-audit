'use strict';

class PageNavigator {
    constructor(chrome) {
        this._chrome = chrome;
        this._resolver = new Promise(() => {});
        this._targetFrameId = null;

        chrome.Page.frameStoppedLoading(evt => {
            if (evt.frameId === this._targetFrameId) {
                this._resolver();
            }
        });
    }

    navigate(url) {
        let self = this;

        return this._chrome.Page.navigate({ url: url })
            .then(r => {
                self._targetFrameId = r.frameId;
                return new Promise((resolve, reject) => {
                    self._resolver = resolve;
                });
            });
    }
}

module.exports = PageNavigator;
