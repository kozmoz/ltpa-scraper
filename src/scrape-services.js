// 'Request' package to handle the https communication.
// https://www.npmjs.com/package/request
// Execute http requests.
const request = require('request');
// path utility class
const path = require('path');

// Fast, flexible & lean implementation of core jQuery designed specifically for the server.
// https://github.com/cheeriojs/cheerio
/** @var {{load:Function}} cheerio */
const cheerio = require('cheerio');
// Read version info of scraper.
const packageJson = require(path.join(__dirname, '..', 'package.json'));

// User agent is based on package name and version and includes the email address.
/** @namespace packageJson.name */
/** @namespace packageJson.version */
const USER_AGENT_STRING = `${ packageJson.name }/${ packageJson.version }`;

const debugPrefix = '\x1B[36mDEBUG\x1B[0m: ';

/**
 * Get the LTPA2 and JSESSION tokens.
 *
 * @param {Object} configuration object with properties 'username', 'password', 'url' and 'verbose' (optional)
 * @return {Promise} A promise that resolves with the tokens found or rejects with an error
 */
function getTokens(configuration) {
    const verbose = configuration.verbose;

    return new Promise((resolveFn, rejectFn) => {
        const { username, password, url } = configuration;
        if (!url) {
            rejectFn({
                errorCode: 'NO_URL',
                errorMessage: 'WPS URL is required'
            });
            return;
        }
        if (!username || !password) {
            rejectFn({
                errorCode: 'NO_CREDENTIALS',
                errorMessage: 'No username and/or password configured, unable log in'
            });
            return;
        }

        const parsedUrl = parseUrl(url);

        // Call the real service.
        const headersGet = {
            'Host': parsedUrl.host,
            'User-Agent': USER_AGENT_STRING,
            'Accept': 'text/html',
            'Accept-Language': 'en-US'
        };

        // POST headers.
        // GET headers will be added to POST headers later.
        const headersPost = {
            'Cookie': '',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': parsedUrl.origin,
            'Referer': parsedUrl.origin
        };

        // Add GET headers to POST headers object.
        Object.assign(headersPost, headersGet);

        // We enable cookies by default, so they're also used in subsequent requests.
        // https://github.com/request/request#readme
        const requestInstance = request.defaults({
            jar: true,
            // Ignore(allow) self-signed certificates.
            rejectUnauthorized: false
        });

        if (verbose) {
            console.log(`${ debugPrefix }Request url: "${ url }"`);
            console.log(`${ debugPrefix }Request headers: "${ JSON.stringify(headersGet, null, 4) }"`);
        }

        // First GET to get the session cookie.
        requestInstance.get({ url: url, headers: headersGet }, (error, response, html) => {

            if (verbose && response) {
                console.log(`${ debugPrefix }Request response: "${ JSON.stringify(response, null, 4) }"`);
            }

            // Error.
            if (error) {
                rejectFn({
                    errorCode: -1,
                    errorMessage: `Accessing url ${ url } to start session failed`,
                    errorDetails: `${ error }`
                });
                return;
            }
            if (response.statusCode !== 200) {
                rejectFn({
                    errorCode: response.statusCode,
                    errorMessage: `Accessing url ${ url } to start session failed with status code: ${ response.statusCode }`
                });
                return;
            }

            const formAction = cheerio.load(html)('form').attr('action');
            if (verbose) {
                console.log(`${ debugPrefix }Form action URL: "${ formAction }"`);
                return;
            }

            if (!formAction) {
                rejectFn({
                    errorCode: -1,
                    errorMessage: `Cannot find login form at location url ${ url }`
                });
                return;
            }

            // Login request.
            let locationAfterRedirects = response.request.uri.href;
            if (response.headers['content-location']) {
                locationAfterRedirects = response.request.uri.protocol + '//' +
                    response.request.uri.host + ':' +
                    response.request.uri.port + '/' +
                    response.headers['content-location'];
            }
            let postUrl = `${ parsedUrl.origin }/${ trimStartSlash(formAction) }`;
            if (locationAfterRedirects && formAction.substr(0, 1) !== '/') {
                postUrl = trimEndSlash(locationAfterRedirects) + '/' + trimStartSlash(formAction);
            }

            // From Chrome:
            // https://www.werkenbijgeldersevallei.nl/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziDVCAo4FTkJGTsYGBu7OJfjghBVEY0sgKgfqjoEpMTAxN3A38DHxMTAwCgw1cQ43MXAwNDIzhCnCaUZAbYZDpqKgIAAfAsh8!/p0/IZ7_00000000000000A0BR2B300I81=CZ6_00000000000000A0BR2B300GC4=LA0=Eaction!wps.portlets.login==/

            // From app:
            // https://www.werkenbijgeldersevallei.nl/!ut/p/z0/04_Sj9CPykssy0xPLMnMz0vMAfIj8nKt8jNTrMoLivV88tMz8_QLsh0VAZSk7Xs!/p0/IZ7_00000000000000A0BR2B300I81=CZ6_00000000000000A0BR2B300GC4=LA0=Eaction!wps.portlets.login==/

            requestInstance.post({
                url: postUrl,
                headers: headersPost,
                // WPS Login form.
                form: {
                    'wps.portlets.userid': username,
                    password: password,
                    ns_Z7_00000000000000A0BR2B300I81__login: 'Log in'
                }
            }, (error, response, html) => {
                // Error.
                if (error) {
                    rejectFn({
                        errorCode: -1,
                        errorMessage: `Accessing url ${ postUrl } to start session failed`,
                        errorDetails: `${ error }`
                    });
                    return;
                }
                if (verbose) {
                    console.log(`${ debugPrefix }Login statusCode: ${ response.statusCode }`);
                    console.log(`${ debugPrefix }Login response html: ${ html }`);
                    console.log(`${ debugPrefix }Cookies: ${ JSON.stringify(response.headers['set-cookie'], null, 2) }`);
                }
                if (response.statusCode !== 200 /* OK */ && response.statusCode !== 302 /* Found */) {
                    rejectFn({
                        errorCode: response.statusCode,
                        errorMessage: `Accessing url ${ url } to start session failed with status code: ${ response.statusCode }`
                    });
                    return;
                }
                const cookiesArray = response.headers['set-cookie'];
                // We at least have received an LTPA token, return successfully.
                if (cookiesArray && cookiesArray.length) {
                    const tokens = parseCookieValues(cookiesArray);
                    if (tokens['LtpaToken2']) {
                        resolveFn(tokens);
                        return;
                    }
                }

                // Test login html response for error message.
                // <p class="error">Enter your username and password. You can find these on your invoices.</p>
                let $ = cheerio.load(html);
                const errorMessage = $('p.error,.wpsStatusMsg').text().trim();
                if (errorMessage) {
                    rejectFn({
                        errorCode: -1,
                        errorMessage: `Login failed with message: ${ errorMessage }`
                    });
                }
                if (!cookiesArray) {
                    rejectFn({
                        errorCode: -1,
                        errorMessage: 'Did not receive any tokens after login'
                    });
                    return;
                }
                rejectFn('Login failed with unknown error');
            });
        });
    });
}

/**
 * Trim excessive whitespace within the string and trim leading and trailing whitespace completely.
 *
 * @param {String} text String to trim
 * @return {String} Trimmed string or empty string in case the given parameter was not truthy
 */
function trimExcessiveWhitespace(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
}

/**
 * Trim start slash, if available.
 *
 * @param {string} url URL to strip / from
 * @returns {string} URL with starting / removed
 */
function trimStartSlash(url) {
    return (url || '').replace(/^\/+/g, '');
}

/**
 * Trim start slash, if available.
 *
 * @param {string} url URL to strip / from
 * @returns {string} URL with starting / removed
 */
function trimEndSlash(url) {
    return (url || '').replace(/\/+$/g, '');
}

/**
 * Parse given URL.
 * https://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
 *
 * @param {string} url
 * @returns {boolean|*|Promise<Response | undefined>|RegExpMatchArray|{hostname: (*|string|string), protocol: (*|string|string), search: (*|string|string), password: (*|string|string), port: (*|string|string), origin: (*|string|string), host: (*|string|string), href: (*|string|string), hash: (*|string|string), pathname: (*|string), username: (*|string|string)}}
 */
function parseUrl(url) {
    // eslint-disable-next-line no-useless-escape
    const m = url.match(/^(([^:\/?#]+:)?(?:\/\/((?:([^\/?#:]*):([^\/?#:]*)@)?([^\/?#:]*)(?::([^\/?#:]*))?)))?([^?#]*)(\?[^#]*)?(#.*)?$/),
        r = {
            hash: m[10] || '',                   // #asd
            host: m[3] || '',                    // localhost:257
            hostname: m[6] || '',                // localhost
            href: m[0] || '',                    // http://username:password@localhost:257/deploy/?asd=asd#asd
            origin: m[1] || '',                  // http://username:password@localhost:257
            pathname: m[8] || (m[1] ? '/' : ''), // /deploy/
            port: m[7] || '',                    // 257
            protocol: m[2] || '',                // http:
            search: m[9] || '',                  // ?asd=asd
            username: m[4] || '',                // username
            password: m[5] || ''                 // password
        };
    if (r.protocol.length === 2) {
        r.protocol = 'file:///' + r.protocol.toUpperCase();
        r.origin = r.protocol + '//' + r.host;
    }
    r.href = r.origin + r.pathname + r.search + r.hash;
    return m && r;
}

/*
 * [
 "WASReqURL=\"\"; Expires=Thu, 01-Dec-94 16:00:00 GMT; Path=/; HttpOnly",
 "LtpaToken2=EPBg/ahVx0LXue+fwP8it1NR87y7vKlbxAczk5qi0D1tHIgIaNs+Wr3UF5y29IHL6xqcThqc0HK7kbDjuLFk51H3tLfWv72lh+J5Fa9SqFph/2Jl7tauE0+aood++a+H+oOnBPWBz8RuSHZyuMrw5WVee7cRbNxCpaEBWTLVDV3Wt9COSNit2Mts+0nuSuBYDwiPUGxwL2kV3DDYFbcgxslGwPOx5TMIL4vFRQ4jEMxl6eg2M/tirvCsP+3eVxcbUk8+BXAMxHu+DyNIytNjR2RkYqFDTU9SbnsIg54G72f+FyVaKsObL/cAnWnmeKK3/+Y1k1pNUdHqRjpfZAael1gvJaH9CeO8SzfG2UJTuSKpaLkSzrXWDliaLWiUcLV3xrp/RMoscIkYi+2bKK4FQfL2vUPBjLhcED9w8taJLTw9v8AbHg9fKqzFPZA+bUGA4HK25X2m1M98a+aODQt6ixsWo+HPbVJdBRSthU2qscQTgLnW/6wQd17KVZ19M1kNywTawiyGIpefxgQR0uDgEg7p/EfooCiYkONwvbwPr8TmI8dCt6pDb0Y5xOalSnp9Pxyd1wIJS2l9SnL7HvMNlwA+zlGmcs1a2+dhP819s6Iag1941L10EpnLuQcGId0ugS+Vx4eXwtXvI3O4AK1Yj93djJSgELcblvA8/9awYVm5LB4bI9hIe9+AtxutBTzJOyS4v7wDoArB5AJLXvRKqba6TJGQLMsTTde1CSS43uA=; Path=/; Domain=.ont.xxx.nl; HttpOnly",
 "JSESSIONID=0000tCpWj6q-5kCiGSQ4uJRT9hp:1d0cq5mdh; Path=/; HttpOnly",
 "WASReqURL=\"\"; Expires=Thu, 01-Dec-94 16:00:00 GMT; Path=/",
 "WASReqURL=\"\"; Expires=Thu, 01-Dec-94 16:00:00 GMT; Path=/; HttpOnly",
 "LtpaToken2=EPBg/ahVx0LXue+fwP8it1NR87y7vKlbxAczk5qi0D1tHIgIaNs+Wr3UF5y29IHL6xqcThqc0HK7kbDjuLFk51H3tLfWv72lh+J5Fa9SqFph/2Jl7tauE0+aood++a+H+oOnBPWBz8RuSHZyuMrw5WVee7cRbNxCpaEBWTLVDV3Wt9COSNit2Mts+0nuSuBYDwiPUGxwL2kV3DDYFbcgxslGwPOx5TMIL4vFRQ4jEMxl6eg2M/tirvCsP+3eVxcbUk8+BXAMxHu+DyNIytNjR2RkYqFDTU9SbnsIg54G72f+FyVaKsObL/cAnWnmeKK3/+Y1k1pNUdHqRjpfZAael1gvJaH9CeO8SzfG2UJTuSKpaLkSzrXWDliaLWiUcLV3xrp/RMoscIkYi+2bKK4FQfL2vUPBjLhcED9w8taJLTw9v8AbHg9fKqzFPZA+bUGA4HK25X2m1M98a+aODQt6ixsWo+HPbVJdBRSthU2qscQTgLnW/6wQd17KVZ19M1kNywTawiyGIpefxgQR0uDgEg7p/EfooCiYkONwvbwPr8TmI8dCt6pDb0Y5xOalSnp9Pxyd1wIJS2l9SnL7HvMNlwA+zlGmcs1a2+dhP819s6Iag1941L10EpnLuQcGId0ugS+Vx4eXwtXvI3O4AK1Yj93djJSgELcblvA8/9awYVm5LB4bI9hIe9+AtxutBTzJOyS4v7wDoArB5AJLXvRKqba6TJGQLMsTTde1CSS43uA=; Path=/; Domain=.ont.xxx.nl; HttpOnly",
 "WASReqURL=\"\"; Expires=Thu, 01-Dec-94 16:00:00 GMT; Path=/"
 ]
 */

/**
 * Parse cookie header to object with keys.
 *
 * @param {string[]} cookiesArray
 * @return Object
 */
function parseCookieValues(cookiesArray) {
    const values = {};
    for (const cookie of cookiesArray) {
        // Split only on first occurrence of '='.
        const [name, value] = cookie.replace('=', '~~~').split('~~~');
        if (name.toLowerCase() !== 'ltpatoken2' && name.toLowerCase() !== 'jsessionid') {
            continue;
        }
        values[name] = value.split(';')[0];
    }
    return values;
}

// Public functions.
exports.getTokens = getTokens;
// For unit testing purposes.
exports._parseUrl = parseUrl;
exports._parseCookieValues = parseCookieValues;
exports._trimExcessiveWhitespace = trimExcessiveWhitespace;
exports._trimStartSlash = trimStartSlash;
exports._trimEndSlash = trimEndSlash;

