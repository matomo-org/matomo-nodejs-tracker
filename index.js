/**
 * A Node.js wrapper for the Piwik (http://piwik.org) tracking HTTP API
 * https://github.com/fhemberger/piwik-tracker
 *
 * @author  Frederic Hemberger
 * @license MIT
 */

'use strict';

var events = require('events'),
    util   = require('util'),
    qs     = require('querystring'),
    agent;


/**
 * @constructor
 * @param {Number} siteId     Id of the site you want to track
 * @param {String} trackerUrl URL of your Piwik instance
 */
function PiwikTracker(siteId, trackerUrl) {
  if (!(this instanceof PiwikTracker)) { return new PiwikTracker(siteId, trackerUrl); }
  events.EventEmitter.call(this);

  if (!siteId || isNaN(+siteId)) {
    throw new Error('siteId must be provided.');
  }

  if (!trackerUrl || typeof trackerUrl !== 'string') {
    throw new Error('A tracker URL must be provided, e.g. http://example.com/piwik.php');
  }

  if (trackerUrl.toString().indexOf("piwik.php")== -1){
    throw new Error('A tracker URL must contain piwik.php in the URL, e.g. http://example.com/piwik.php');
  }

  this.siteId = siteId;
  this.trackerUrl = trackerUrl;

  // Use either HTTPS or HTTP agent according to Piwik tracker URL
  agent = require( /^https:/.test(trackerUrl) ? 'https' : 'http' );
}
util.inherits(PiwikTracker, events.EventEmitter);


/**
 * Executes the call to the Piwik tracking API
 *
 * For a list of tracking option parameters see
 * http://developer.piwik.org/api-reference/tracking-api
 *
 * @param {(String|Object)} URL to track or options (must contain URL as well)
 */
PiwikTracker.prototype.track = function track(options) {
  var self = this;
  var hasErrorListeners = this.listeners('error').length;

  if (typeof options === "string") {
    options = { url: options };
  }

  // Set mandatory options
  options = options || {};
  options.idsite = this.siteId;
  options.rec = 1;

  if (!options.url) { throw new Error('URL to be tracked must be specified.'); }

  var requestUrl = this.trackerUrl + '?' + qs.stringify(options);
  var req = agent.get(requestUrl, function(res) {
    // Check HTTP statuscode for 200 and 30x
    if ( !/^(200|30[12478])$/.test(res.statusCode) ) {
      if (hasErrorListeners) { self.emit('error', res.statusCode); }
    }
  });

  req.on('error', function(e) {
    if (hasErrorListeners) { self.emit('error', e.message); }
  });

  req.end();
};


module.exports = PiwikTracker;
