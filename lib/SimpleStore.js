'use strict';

class SimpleStore {
    constructor() {
        this._store = [];
    }

    contains(k) {
        return this._store.hasOwnProperty(k);
    }

    push(k, v) {
        this._store[k] = v;
    }

    pop(k) {
        let r = this._store[k];
        delete this._store[k];
        return r;
    }
}

module.exports = SimpleStore;
