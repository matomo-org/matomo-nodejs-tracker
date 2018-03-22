/*jshint -W068 */
'use strict';

const chai      = require('chai');
const sinon     = require('sinon');
const sinonChai = require('sinon-chai');
const http      = require('http');
const https     = require('https');
const nock      = require('nock');

chai.should();
chai.use(sinonChai);


var MatomoTracker = require('../index.js');
describe('MatomoTracker()', () => {

  it('should throw if no parameters provided', () => {
    (() => new MatomoTracker()).should.throw(/siteId/);
  });

  it('should throw if no siteId is provided', () => {
    (() => new MatomoTracker(null)).should.throw(/siteId/);
  });

  it('should throw if siteId provided is neither a number nor a string', () => {
    (() => new MatomoTracker({ foo: 'bar' })).should.throw(/siteId/);
    (() => new MatomoTracker([1,2,3])).should.throw(/siteId/);
    (() => new MatomoTracker(true)).should.throw(/siteId/);
    (() => new MatomoTracker(() => { return true; })).should.throw(/siteId/);
    (() => new MatomoTracker(1, 'http://example.com/matomo.php')).should.not.throw();
    (() => new MatomoTracker('siteId', 'http://example.com/matomo.php')).should.not.throw();
  });

  it('should throw if no trackerUrl is provided', () => {
    (() => new MatomoTracker(1)).should.throw(/tracker/);
  });

  it('should throw if no trackerUrl is not valid (no matomo.php endpoint)', () => {
    (() => new MatomoTracker(1, 'http://example.com/index.php')).should.throw(/tracker/);
  });

  it('should allow invalid URL if noURLValidation is set', () => {
    (() => new MatomoTracker(1, 'http://example.com/index.php', true)).should.not.throw(/tracker/);
  });

  it('should have properties siteId/trackerUrl', () => {
    var matomo = new MatomoTracker(1, 'http://example.com/matomo.php');
    matomo.siteId.should.equal(1);
    matomo.trackerUrl.should.equal('http://example.com/matomo.php');
  });

});


describe('#track()', () => {
  var httpMock, httpSpy, matomo;

  beforeEach(() => {
    matomo = new MatomoTracker(1, 'http://example.com/matomo.php');

    httpMock = nock('http://example.com')
      .filteringPath(() => '/matomo.php')
      .get('/matomo.php');
    httpSpy = sinon.spy(http, 'get');
  });

  afterEach(() => {
    matomo = null;
    nock.restore();
    httpSpy.restore();
  });

  it('should throw without parameter', () => {
    (() => matomo.track()).should.throw(/URL/);
  });

  it('should accept a url as string', () => {
    httpMock.reply(200);
    matomo.track('http://mywebsite.com/');
    httpSpy.should.have.been.calledWith('http://example.com/matomo.php?url=http%3A%2F%2Fmywebsite.com%2F&idsite=1&rec=1');
  });

  it('should accept an parameter object', () => {
    httpMock.reply(200);
    matomo.track({ url: 'http://mywebsite.com/' });
    httpSpy.should.have.been.calledWith('http://example.com/matomo.php?url=http%3A%2F%2Fmywebsite.com%2F&idsite=1&rec=1');
  });

  it('should throw without options.url', () => {
    (() => matomo.track({})).should.throw(/URL/);
  });

  it('should emit an error if HTTP response status is not 200/30x', (done) => {
    httpMock.reply(404);

    matomo.on('error', (param) => {
      param.should.match(/^(404|getaddrinfo ENOTFOUND)/);
      done();
    });
    matomo.track({ url: 'http://mywebsite.com/' });
  });
});


describe('#track() - HTTPS support', () => {
  var httpsMock, httpsSpy, matomo;

  before(() => {
    matomo = new MatomoTracker(1, 'https://example.com/matomo.php');

    httpsMock = nock('https://example.com')
      .filteringPath(() => '/matomo.php')
      .get('/matomo.php');
    httpsSpy = sinon.spy(https, 'get');
  });

  after(() => {
    matomo = null;
    nock.restore();
    httpsSpy.restore();
  });

  it('should use HTTPS to access Matomo, when stated in the URL', () => {
    httpsMock.reply(200);
    matomo.track('http://mywebsite.com/');
    httpsSpy.should.have.been.calledWith('https://example.com/matomo.php?url=http%3A%2F%2Fmywebsite.com%2F&idsite=1&rec=1');
  });
});


describe('#bulkTrack()', () => {
  var httpMock, httpSpy, matomo;

  var events = [{
    '_id': 'AA814767-7B1F-5C81-8F1D-8E47AD7D2982',
    'cdt': '2018-03-22T02:32:22.867Z',
    'e_c': 'Buy',
    'e_a': 'rightButton',
    'e_v': '2'
  }];

  before(() => {
    matomo = new MatomoTracker(1, 'http://example.com/matomo.php');

    httpMock = nock('http://example.com')
      .filteringPath(() => '/matomo.php')
      .get('/matomo.php');
    httpSpy = sinon.spy(http, 'get');
  });

  after(() => {
    matomo = null;
    nock.restore();
    httpSpy.restore();
  });

  it('should throw without parameter', () => {
    (() => matomo.trackBulk()).should.throw();
  });


  () => matomo.trackBulk([{}])();

  it('should throw without idsite', () => {
    matomo.siteId = null;
    (() => matomo.trackBulk([{}])).should.throw();
    matomo.siteId = 1;
  });

  it('should POST to server', () => {
    httpMock.reply(200);
    matomo.trackBulk(events, () => {});
  });

  it('should emit an error if HTTP response status is not 200/30x', (done) => {
    httpMock.reply(404);

    matomo.on('error', (param) => {
      param.should.match(/^(404|getaddrinfo ENOTFOUND)/);
      done();
    });
    matomo.trackBulk(events);
  });
});


describe('#bulkTrack() - HTTPS support', () => {
  var httpsMock, httpsSpy, matomo;

  before(() => {
    matomo = new MatomoTracker(1, 'https://127.0.0.1/matomo.php');

    httpsMock = nock('https://127.0.0.1')
      .filteringPath(() => '/matomo.php')
      .get('/matomo.php');
    httpsSpy = sinon.spy(https, 'get');
  });

  it('should use HTTPS to access matomo, when stated in the URL', () => {
    httpsMock.reply(200);
    matomo.track('http://mywebsite.com/');
  });

  after(() => {
    matomo = null;
    nock.restore();
    httpsSpy.restore();
  });
});
