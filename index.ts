/**
 * A Node.js wrapper for the Matomo (http://matomo.org) tracking HTTP API
 * https://github.com/matomo-org/matomo-nodejs-tracker
 *
 * @author  Frederic Hemberger, Matomo Team
 * @license MIT
 */

'use strict';

import * as http from "http";
import {ClientRequest, IncomingMessage} from "http";
import * as https from "https";
import * as assert from "assert";
import * as events from "events";
import * as qs from "querystring";
import * as url from "url";


/**
 * @constructor
 * @param {Number} siteId     Id of the site you want to track
 * @param {String} trackerUrl URL of your Matomo instance
 * @param {Boolean} [noURLValidation]  Set to true if the `piwik.php` or `matomo.php` has been renamed
 */
export class MatomoTracker extends events.EventEmitter {
  private readonly siteId: number;
  private readonly trackerUrl: string;
  private readonly usesHTTPS: boolean;

  constructor(siteId: number, trackerUrl: string, noURLValidation?: boolean) {
    super();

    events.EventEmitter.call(this);

    assert.ok(siteId && (typeof siteId === 'number' || typeof siteId === 'string'), 'Matomo siteId required.');
    assert.ok(trackerUrl && typeof trackerUrl === 'string', 'Matomo tracker URL required, e.g. http://example.com/matomo.php');
    if (!noURLValidation) {
      assert.ok(trackerUrl.endsWith('matomo.php') || trackerUrl.endsWith('piwik.php'), 'A tracker URL must end with "matomo.php" or "piwik.php"');
    }

    this.siteId = siteId;
    this.trackerUrl = trackerUrl;

    // Use either HTTPS or HTTP agent according to Matomo tracker URL
    this.usesHTTPS = trackerUrl.startsWith('https');
  }


  /**
   * Executes the call to the Matomo tracking API
   *
   * For a list of tracking option parameters see
   * https://developer.matomo.org/api-reference/tracking-api
   *
   * @param {(String|Object)} options URL to track or options (must contain URL as well)
   */
  track(options: MatomoSingleTrackOptions | string) {
    const hasErrorListeners = this.listeners('error').length;

    if (typeof options === 'string') {
      options = {
        url: options
      };
    }

    // Set mandatory options
    // options = options || {};
    if (!options || !options.url) {
      assert.fail('URL to be tracked must be specified.');
      return;
    }
    options.idsite = this.siteId;
    options.rec = 1;

    const requestUrl = this.trackerUrl + '?' + qs.stringify(options);
    const self = this;
    let req: ClientRequest;
    if (this.usesHTTPS) {
      req = https.get(requestUrl, handleResponse);
    } else {
      req = http.get(requestUrl, handleResponse);
    }

    function handleResponse(res: IncomingMessage) {
      // Check HTTP statuscode for 200 and 30x
      if (res.statusCode && !/^(20[04]|30[12478])$/.test(res.statusCode.toString())) {
        if (hasErrorListeners) {
          self.emit('error', res.statusCode);
        }
      }
    }

    req.on('error', err => {
      hasErrorListeners && this.emit('error', err.message);
    });

    req.end();
  }


  // eslint-disable-next-line no-unused-vars
  trackBulk(events: MatomoTrackOptions[], callback: (response: string) => void) {
    const hasErrorListeners = this.listeners('error').length;

    assert.ok(events && (events.length > 0), 'Events require at least one.');
    assert.ok(this.siteId !== undefined && this.siteId !== null, 'siteId must be specified.');


    const body = JSON.stringify({
      requests: events.map(query => {
        query.idsite = this.siteId;
        query.rec = 1;
        return '?' + qs.stringify(query);
      })
    });

    const uri = url.parse(this.trackerUrl);

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
    let req: ClientRequest;

    if (this.usesHTTPS) {
      req = https.request(requestOptions, handleResponse);
    } else {
      req = http.request(requestOptions, handleResponse);
    }

    const self = this;

    function handleResponse(res: IncomingMessage) {
      if (res.statusCode && !/^(20[04]|30[12478])$/.test(res.statusCode.toString())) {
        if (hasErrorListeners) {
          self.emit('error', res.statusCode);
        }
      }

      const data: Buffer[] = [];

      res.on('data', chunk => {
        data.push(chunk);
      });

      res.on('end', () => {
        const output = Buffer.concat(data).toString();
        typeof callback === 'function' && callback(output);
      });
    }

    req.on('error', (err) => {
        hasErrorListeners && this.emit('error', err.message);
      }
    );

    req.write(body);
    req.end();
  }
}

module.exports = MatomoTracker;

interface MatomoSingleTrackOptions extends MatomoTrackOptions {
  url: string;
}


interface MatomoTrackOptions {
  [key: string]: number | string | undefined

  idsite?: number
  rec?: 1

  // Recommended parameters
  action_name?: string;
  _id?: string;
  rand?: string;
  apiv?: 1;

  // Optional User info
  urlref?: string;
  _cvar?: string;
  _idvc?: string;
  _viewts?: string;
  _idts?: string;
  _rcn?: string;
  _rck?: string;
  res?: string;
  h?: number;
  m?: number;
  s?: number;
  fla?: 1;
  java?: 1;
  dir?: 1;
  qt?: 1;
  pdf?: 1;
  wma?: 1;
  ag?: 1;
  cookie?: 1;
  ua?: string;
  lang?: string;
  uid?: string;
  cid?: string;
  new_visit?: number;

  // Optional Action info
  cvar?: string;
  link?: string;
  download?: string;
  search?: string;
  search_cat?: string;
  search_count?: number;
  pv_id?: string;
  idgoal?: number;
  revenue?: number;
  gt_ms?: number;
  cs?: string;
  ca?: 1;

  // Optional Event Tracking info
  e_c?: string;
  e_a?: string;
  e_n?: string;
  e_v?: string;

  // Optional Content Tracking info
  c_n?: string;
  c_p?: string;
  c_t?: string;
  c_i?: string;

  // Optional Ecommerce info
  ec_id?: string;
  ec_items?: string;
  ec_st?: number;
  ec_tx?: number;
  ec_sh?: number;
  ec_dt?: number;
  _ects?: number;

  // Other parameters (require authentication via token_auth)
  token_auth?: string;
  cip?: string;
  cdt?: string;
  country?: string;
  region?: string;
  city?: string;
  lat?: string;
  long?: string;

  // Optional Media Analytics parameters
  ma_id?: string;
  ma_ti?: string;
  ma_re?: string;
  ma_mt?: "video" | "audio";
  ma_pn?: string;
  ma_sn?: number;
  ma_le?: number;
  ma_ps?: number;
  ma_ttp?: number;
  ma_w?: number;
  ma_h?: number;
  ma_fs?: 1 | 0;
  ma_se?: string;

  // Optional Queued Tracking parameters
  queuedtracking?: 0

  // Other parameters
  send_image?: 0;
  ping?: 1;
  bots?: 1;
}
