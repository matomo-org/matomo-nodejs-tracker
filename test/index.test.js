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


var PiwikTracker = require('../index.js');
describe('PiwikTracker()', () => {

  it('should throw if no parameters provided', () => {
    (() => new PiwikTracker()).should.throw(/siteId/);
  });

  it('should throw if no siteId is provided', () => {
    (() => new PiwikTracker(null)).should.throw(/siteId/);
  });
    
  it('should throw if siteId provided is neither a number nor a string', () => {
    (() => new PiwikTracker({ foo: 'bar' })).should.throw(/siteId/);
    (() => new PiwikTracker([1,2,3])).should.throw(/siteId/);
    (() => new PiwikTracker(true)).should.throw(/siteId/);
    (() => new PiwikTracker(() => { return true; })).should.throw(/siteId/);
  }); 

  it('should throw if no trackerUrl is provided', () => {
    (() => new PiwikTracker(1)).should.throw(/tracker/);
  });

  it('should throw if no trackerUrl is not valid (no piwik.php endpoint)', () => {
    (() => new PiwikTracker(1,'http://example.com/index.php')).should.throw(/tracker/);
  });

  it('should have properties siteId/trackerUrl', () => {
    var piwik = new PiwikTracker(1, 'http://example.com/piwik.php');
    piwik.siteId.should.equal(1);
    piwik.trackerUrl.should.equal('http://example.com/piwik.php');
  });

});


describe('#track()', () => {
  var httpMock, httpSpy, piwik;

  beforeEach(() => {
    piwik = new PiwikTracker(1, 'http://example.com/piwik.php');

    httpMock = nock('http://example.com')
      .filteringPath(() => '/piwik.php')
      .get('/piwik.php');
    httpSpy = sinon.spy(http, 'get');
  });

  afterEach(() => {
    piwik = null;
    nock.restore();
    httpSpy.restore();
  });

  it('should throw without parameter', () => {
    (() => piwik.track()).should.throw(/URL/);
  });

  it('should accept a url as string', () => {
    httpMock.reply(200);
    piwik.track('http://mywebsite.com/');
    httpSpy.should.have.been.calledWith('http://example.com/piwik.php?url=http%3A%2F%2Fmywebsite.com%2F&idsite=1&rec=1');
  });

  it('should accept an parameter object', () => {
    httpMock.reply(200);
    piwik.track({ url: 'http://mywebsite.com/' });
    httpSpy.should.have.been.calledWith('http://example.com/piwik.php?url=http%3A%2F%2Fmywebsite.com%2F&idsite=1&rec=1');
  });

  it('should throw without options.url', () => {
    (() => piwik.track({})).should.throw(/URL/);
  });

  it('should emit an error if HTTP response status is not 200/30x', (done) => {
    httpMock.reply(404);

    piwik.on('error', (param) => {
      param.should.match(/^(404|getaddrinfo ENOTFOUND)/);
      done();
    });
    piwik.track({ url: 'http://mywebsite.com/' });
  });
});


describe('#track() - HTTPS support', () => {
  var httpsMock, httpsSpy, piwik;

  before(() => {
    piwik = new PiwikTracker(1, 'https://example.com/piwik.php');

    httpsMock = nock('https://example.com')
      .filteringPath(() => '/piwik.php')
      .get('/piwik.php');
    httpsSpy = sinon.spy(https, 'get');
  });

  after(() => {
    piwik = null;
    nock.restore();
    httpsSpy.restore();
  });

  it('should use HTTPS to access Piwik, when stated in the URL', () => {
    httpsMock.reply(200);
    piwik.track('http://mywebsite.com/');
    httpsSpy.should.have.been.calledWith('https://example.com/piwik.php?url=http%3A%2F%2Fmywebsite.com%2F&idsite=1&rec=1');
  });
});
