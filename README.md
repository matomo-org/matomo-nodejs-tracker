# Matomo Tracker [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]

> A wrapper for the Matomo Tracking HTTP API

## Usage

First, install `matomo-tracker` as a dependency:

```shell
npm install --save matomo-tracker
```

Then, use it in your project:

```javascript
var MatomoTracker = require('matomo-tracker');

// Initialize with your site ID and Matomo URL
var matomo = new MatomoTracker(1, 'http://mywebsite.com/matomo.php');

// Optional: Respond to tracking errors
matomo.on('error', function(err) {
  console.log('error tracking request: ', err);
});

// Track a request URL:
// Either as a simple string …
matomo.track('http://example.com/track/this/url');

// … or provide further options:
matomo.track({
  url: 'http://example.com/track/this/url',
  action_name: 'This will be shown in your dashboard',
  ua: 'Node.js v0.10.24',
  cvar: JSON.stringify({
    '1': ['custom variable name', 'custom variable value']
  })
});

// … or trackBulk:
var events = [{
  '_id': 'AA814767-7B1F-5C81-8F1D-8E47AD7D2982',
  'cdt': '2018-03-22T02:32:22.867Z',
  'e_c': 'Buy',
  'e_a': 'rightButton',
  'e_v': '2'
},{
  '_id': 'AA814767-7B1F-5C81-8F1D-8E47AD7D2982',
  'cdt': '2018-03-22T02:33:52.962Z',
  'e_c': 'Buy',
  'e_a': 'leftButton',
  'e_v': '4'
}];
matomo.trackBulk(events, (resData) => {
  // done.
})
```

That's it. For a complete list of options, see [Matomo's Tracking HTTP API Reference](https://developer.matomo.org/api-reference/tracking-api).


## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

[npm-url]: https://npmjs.org/package/matomo-tracker
[npm-image]: https://img.shields.io/npm/v/matomo-tracker.svg

[travis-url]: https://travis-ci.org/matomo-org/matomo-nodejs-tracker
[travis-image]: https://img.shields.io/travis/matomo-org/matomo-nodejs-tracker.svg
