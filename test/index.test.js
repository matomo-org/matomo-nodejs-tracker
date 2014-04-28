/*jshint -W068 */
'use strict';

var chai      = require('chai'),
    sinon     = require('sinon'),
    sinonChai = require('sinon-chai'),
    http      = require('http'),
    https     = require('https'),
    nock      = require('nock');

chai.should();
chai.use(sinonChai);


var PiwikTracker = require('../index.js');
describe('PiwikTracker()', function() {

  it('should thow if no parameters provided', function() {
    (function(){ new PiwikTracker(); }).should.throw(/siteId/);
  });

  it('should thow if no siteId is provided', function() {
    (function(){ new PiwikTracker(null); }).should.throw(/siteId/);
  });

  it('should thow if no trackerUrl is provided', function() {
    (function(){ new PiwikTracker(1); }).should.throw(/tracker/);
  });

  it('should have properties siteId/trackerUrl', function() {
    var piwik = new PiwikTracker(1, 'http://example.com/piwik.php');
    piwik.siteId.should.equal(1);
    piwik.trackerUrl.should.equal('http://example.com/piwik.php');
  });

});


describe('#track()', function() {
  var httpMock, httpSpy, piwik;

  beforeEach(function() {
    piwik = new PiwikTracker(1, 'http://example.com/piwik.php');

    httpMock = nock('http://example.com')
      .filteringPath(function() { return '/piwik.php'; })
      .get('/piwik.php');
    httpSpy = sinon.spy(http, 'get');
  });

  afterEach(function() {
    piwik = null;
    nock.restore();
    httpSpy.restore();
  });

  it('should throw without parameter', function() {
    (function(){ piwik.track(); }).should.throw(/URL/);
  });

  it('should accept a url as string', function() {
    httpMock.reply(200);
    piwik.track('http://mywebsite.com/');
    httpSpy.should.have.been.calledWith('http://example.com/piwik.php?url=http%3A%2F%2Fmywebsite.com%2F&idsite=1&rec=1');
  });

  it('should accept an parameter object', function() {
    httpMock.reply(200);
    piwik.track({ url: 'http://mywebsite.com/' });
    httpSpy.should.have.been.calledWith('http://example.com/piwik.php?url=http%3A%2F%2Fmywebsite.com%2F&idsite=1&rec=1');
  });

  it('should throw without options.url', function() {
    (function(){ piwik.track({}); }).should.throw(/URL/);
  });

  it('should emit an error if HTTP response status is not 200/30x', function(done) {
    httpMock.reply(404);

    piwik.on('error', function(param) {
      param.should.match(/^(404|getaddrinfo ENOTFOUND)/);
      done();
    });
    piwik.track({ url: 'http://mywebsite.com/' });
  });
});


describe('#track() - HTTPS support', function() {
  var httpsMock, httpsSpy, piwik;

  before(function() {
    piwik = new PiwikTracker(1, 'https://example.com/piwik.php');

    httpsMock = nock('https://example.com')
      .filteringPath(function() { return '/piwik.php'; })
      .get('/piwik.php');
    httpsSpy = sinon.spy(https, 'get');
  });

  after(function() {
    piwik = null;
    nock.restore();
    httpsSpy.restore();
  });

  it('should use HTTPS to access Piwik, when stated in the URL', function() {
    httpsMock.reply(200);
    piwik.track('http://mywebsite.com/');
    httpsSpy.should.have.been.calledWith('https://example.com/piwik.php?url=http%3A%2F%2Fmywebsite.com%2F&idsite=1&rec=1');
  });
});
