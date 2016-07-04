'use strict';

let auditor = require('./lib/auditor');
let config = require('./config');

auditor.audit(config)
    .then(r => console.log(JSON.stringify(r, null, 4)))
    .catch(e => console.error(e.hasOwnProperty('stack') ? e.stack : e));
