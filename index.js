/**
 * A Node.js wrapper for the Matomo (http://matomo.org) tracking HTTP API
 * https://github.com/matomo-org/matomo-nodejs-tracker
 *
 * @author  Frederic Hemberger, Matomo Team
 * @license MIT
 */

'use strict';

const assert = require('assert');
const events = require('events');
const util = require('util');
const qs = require('querystring');
const url = require('url');


/**
 * @constructor
 * @param {Number} siteId     Id of the site you want to track
 * @param {String} trackerUrl URL of your Matomo instance
 * @param {Boolean} [true] noURLValidation Set to true if the `piwik.php` has been renamed
 */
function MatomoTracker (siteId, trackerUrl, noURLValidation) {
  if (!(this instanceof MatomoTracker)) {
    return new MatomoTracker(siteId, trackerUrl, noURLValidation);
  }
  events.EventEmitter.call(this);

  assert.ok(siteId && (typeof siteId === 'number' || typeof siteId === 'string'), 'Matomo siteId required.');
  assert.ok(trackerUrl && typeof trackerUrl === 'string', 'Matomo tracker URL required, e.g. http://example.com/matomo.php');
  if (!noURLValidation) {
    assert.ok(trackerUrl.endsWith('matomo.php') || trackerUrl.endsWith('piwik.php'), 'A tracker URL must end with "matomo.php" or "piwik.php"');
  }

  this.siteId = siteId;
  this.trackerUrl = trackerUrl;

  // Use either HTTPS or HTTP agent according to Matomo tracker URL
  this.agent = require(trackerUrl.startsWith('https') ? 'https' : 'http');
}

util.inherits(MatomoTracker, events.EventEmitter);


/**
 * Executes the call to the Matomo tracking API
 *
 * For a list of tracking option parameters see
 * https://developer.matomo.org/api-reference/tracking-api
 *
 * @param {(String|Object)} options URL to track or options (must contain URL as well)
 */
MatomoTracker.prototype.track = function track (options) {
  var hasErrorListeners = this.listeners('error').length;

  if (typeof options === 'string') {
    options = {
      url: options
    };
  }

  // Set mandatory options
  options = options || {};
  options.idsite = this.siteId;
  options.rec = 1;

  assert.ok(options.url, 'URL to be tracked must be specified.');

  var requestUrl = this.trackerUrl + '?' + qs.stringify(options);
  var self = this;
  var req = this.agent.get(requestUrl, function (res) {
    // Check HTTP statuscode for 200 and 30x
    if (!/^(20[04]|30[12478])$/.test(res.statusCode)) {
      if (hasErrorListeners) {
        self.emit('error', res.statusCode);
      }
    }
  });

  req.on('error', function (err) {
    hasErrorListeners && self.emit('error', err.message);
  });

  req.end();
};


MatomoTracker.prototype.trackBulk = function trackBulk (events, callback) {
  var hasErrorListeners = this.listeners('error').length;

  assert.ok(events && (events.length > 0), 'Events require at least one.');
  assert.ok(this.siteId !== undefined && this.siteId !== null, 'siteId must be specified.');

  var body = JSON.stringify({
    requests: events.map(query => {
      query.idsite = this.siteId;
      query.rec = 1;
      return '?' + qs.stringify(query);
    })
  });

  var uri = url.parse(this.trackerUrl);

  const requestOptions = {
    protocol: uri.protocol,
    hostname: uri.hostname,
    port: uri.port,
    path: uri.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    }
  };

  const req = this.agent.request(requestOptions, res => {
    if (!/^(20[04]|30[12478])$/.test(res.statusCode)) {
      if (hasErrorListeners) {
        this.emit('error', res.statusCode);
      }
    }

    let data = [];

    res.on('data', chunk => {
      data.push(chunk);
    });

    res.on('end', () => {
      data = Buffer.concat(data).toString();
      typeof callback === 'function' && callback(data);
    });
  });

  req.on('error', (err) => {
      hasErrorListeners && this.emit('error', err.message);
    }
  );

  req.write(body);
  req.end();
};

module.exports = MatomoTracker;
