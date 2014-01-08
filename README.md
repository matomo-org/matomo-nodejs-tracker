# Piwik Tracker [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]

> A wrapper for the Piwik Tracking HTTP API

## Usage

First, install `piwik-tracker` as a dependency:

```shell
npm install --save piwik-tracker
```

Then, use it in your project:

```javascript
var PiwikTracker = require('piwik-tracker');

// Initialize with your site ID and Piwik URL
var piwik = new PiwikTracker(1, 'http://mywebsite.com/piwik.php');

// Optional: Respond to tracking errors
piwik.on('error', function(err) {
  console.log('error tracking request: ', err)
})

// Track a request URL:
// Either as a simple string …
piwik.track('http://example.com/track/this/url');

// … or provide further options:
piwik.track({
  url: 'http://example.com/track/this/url',
  actionName: 'This will be shown in your dashboard',
  ua: 'Node.js v0.10.24',
  cvar: {
    '1': ['custom variable name', 'custom variable value']
  }
});
```

That's it. For a complete list of options, see [Piwik's Tracking HTTP API Reference](http://developer.piwik.org/api-reference/tracking-api).


## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

[npm-url]: https://npmjs.org/package/piwik-tracker
[npm-image]: https://badge.fury.io/js/piwik-tracker.png

[travis-url]: http://travis-ci.org/fhemberger/piwik-tracker
[travis-image]: https://secure.travis-ci.org/fhemberger/piwik-tracker.png?branch=master
