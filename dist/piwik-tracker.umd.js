(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global['piwik-tracker'] = factory());
}(this, (function () { 'use strict';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

var _sPO = Object.setPrototypeOf || function _sPO(o, p) {
  o.__proto__ = p;
  return o;
};

var _construct = typeof Reflect === "object" && Reflect.construct || function _construct(Parent, args, Class) {
  var Constructor,
      a = [null];
  a.push.apply(a, args);
  Constructor = Parent.bind.apply(Parent, a);
  return _sPO(new Constructor(), Class.prototype);
};

/**
 * A Node.js wrapper for the Piwik (http://piwik.org) tracking HTTP API
 * https://github.com/fhemberger/piwik-tracker
 *
 * @author  Frederic Hemberger
 * @license MIT
 */
var assert = require('assert');

var events = require('events');

var util = require('util');

var qs = require('querystring');

var PiwikTracker =
/*#__PURE__*/
function () {
  /**
   * @constructor
   * @param {Number} siteId     Id of the site you want to track
   * @param {String} trackerUrl URL of your Piwik instance
   */
  function PiwikTracker(siteId, trackerUrl) {
    _classCallCheck(this, PiwikTracker);

    if (!(this instanceof PiwikTracker)) {
      return new PiwikTracker(siteId, trackerUrl);
    }

    events.EventEmitter.call(this);
    assert.ok(siteId && (typeof siteId === 'number' || typeof siteId === 'string'), 'Piwik siteId required.');
    assert.ok(trackerUrl && typeof trackerUrl === 'string', 'Piwik tracker URL required, e.g. http://example.com/piwik.php');
    assert.ok(trackerUrl.endsWith('piwik.php'), 'A tracker URL must end with "piwik.php"');
    this.siteId = siteId;
    this.trackerUrl = trackerUrl; // Use either HTTPS or HTTP agent according to Piwik tracker URL

    this.agent = require(trackerUrl.startsWith('https') ? 'https' : 'http');
  }
  /**
   * Executes the call to the Piwik tracking API
   *
   * For a list of tracking option parameters see
   * http://developer.piwik.org/api-reference/tracking-api
   *
   * @param {(String|Object)} options URL to track or options (must contain URL as well)
   */


  _createClass(PiwikTracker, [{
    key: "track",
    value: function track(options) {
      var _this = this;

      var hasErrorListeners = this.listeners('error').length;

      if (typeof options === 'string') {
        options = {
          url: options
        };
      } // Set mandatory options


      options = options || {};
      options.idsite = this.siteId;
      options.rec = 1;
      assert.ok(options.url, 'URL to be tracked must be specified.');
      var requestUrl = this.trackerUrl + '?' + qs.stringify(options);
      var req = this.agent.get(requestUrl, function (res) {
        // Check HTTP statuscode for 200 and 30x
        if (!/^(200|30[12478])$/.test(res.statusCode)) {
          if (hasErrorListeners) {
            _this.emit('error', res.statusCode);
          }
        }
      });
      req.on('error', function (err) {
        hasErrorListeners && self.emit('error', err.message);
      });
      req.end();
    }
  }]);
  return PiwikTracker;
}();

util.inherits(PiwikTracker, events.EventEmitter);

return PiwikTracker;

})));
