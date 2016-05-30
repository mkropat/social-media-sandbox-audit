'use strict';

let url = require('url');

let chromeLauncher = require('./lib/chromeLauncher');
let promises = require('./lib/promises');

let cfg = require('./config');

let settings = {
    chromeCloseDelay: 1000, //ms
    pageLoadDelay: 10 * 1000 //ms
};

locateArticleUrls(cfg.sites)
    .then(testAllChromeProfiles)
    .then(r => console.log(JSON.stringify(r, null, 4)))
    .catch(e => console.error(e.hasOwnProperty('stack') ? e.stack : e));

function locateArticleUrls(sites) {
    return chromeLauncher.launch(`--profile-directory="${cfg.stockProfileName}"`)
        .then(c => {
            return promises.runSequentially(sites.map(s => () => locateArticleUrl(c, s.homeUrl, s.articleSelector)))
                .then(r => closeChrome(c).then(() => r))
                .catch(e => c.close().then(() => Promise.reject(e)));
        });
}

function locateArticleUrl(chrome, homeUrl, articleSelector) {
    return chrome.navigate(homeUrl)
        .then(() => chrome.querySelector(articleSelector));
}

function testAllChromeProfiles(sites) {
    return promises.runSequentially(
        cfg.profiles.map(p => () => testChromeProfile(p, sites)));
}

function testChromeProfile(profileName, sites) {
    return chromeLauncher.launch(`--profile-directory="${profileName}"`)
        .then(c => {
            return testSites(c, sites)
                .then(r => closeChrome(c).then(() => r))
                .then(r => ({ profile: profileName, sites: r }))
                .catch(e => c.close().then(() => Promise.reject(e)));
        });
}

function testSites(chrome, sites) {
    let requestsResult = {};

    chrome.requestCompleted(request => {
        cfg.suspects.forEach(s => {
            addSiteRequestsToResult(s, request, requestsResult);
        });
    });

    return promises.runSequentially(sites.map(s => () => loadPage(s)));

    function loadPage(siteUrl) {
        requestsResult = {};
        chrome.reset();

        let siteResult = {
            domain: url.parse(siteUrl).hostname,
            url: siteUrl,
            requests: {}
        };

        return chrome.navigate(siteUrl)
            .then(() => promises.delay(settings.pageLoadDelay))
            .then(() => {
                siteResult.requests = requestsResult;
                return siteResult;
            });
    }
}

function addSiteRequestsToResult(siteName, request, result) {
    let u = url.parse(request.url);
    if (u.hostname.includes(siteName)) {
        result[siteName] = result[siteName] || [];
        result[siteName].push(buildRequestResult(request));
    }
}

function buildRequestResult(request) {
    let r = {
        method: request.method,
        url: request.url
    };

    let headers = request.headers;
    if (headers['Referer']) {
        r.referer = headers['Referer'];
    }
    if (headers['Cookie']) {
        r.cookie = headers['Cookie'];
        r.was_cookie_sent = !!headers['Cookie'];
    }

    return r;
}

function closeChrome(chrome) {
    return chrome.close()
        .then(() => promises.delay(settings.chromeCloseDelay));
}
