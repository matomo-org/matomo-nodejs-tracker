/*jshint -W068 */
'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var http = require('http');
var nock = require('nock');

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

  before(function() {
    piwik = new PiwikTracker(1, 'http://example.com/piwik.php');

    httpMock = nock('http://example.com')
      .filteringPath(function() { return '/piwik.php'; })
      .get('/piwik.php');
    httpSpy = sinon.spy(http, 'get');
  });

  after(function() {
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
      param.should.equal(404);
      done();
    });
    piwik.track({ url: 'http://mywebsite.com/' });
  });
});
