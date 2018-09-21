'use strict';
/*!
 * ISC License
 *
 * Copyright (c) 2018, Andrea Giammarchi, @WebReflection
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
 * OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

'use strict';

const http = require('http');
const https = require('https');
const parse = require('url').parse;

const URLSearchParams = require('url-search-params');

const USER_AGENT = 'faroff/' + require(
  require('path').join(__dirname, '..', 'package.json')
).version;

const remote = {
  http: http,
  https: https
};

const request = (method, url, info) => new Promise((resolve, reject) => {
  const headers = Object.assign(
    {'User-Agent': USER_AGENT},
    info.headers
  );
  const location = parse(url);
  const params = new URLSearchParams(location.search);
  if ('query' in info)
    Object.keys(info.query)
          .forEach(key => params.append(key, info.query[key]));
  const search = '?' + params;
  const json = 'json' in info ? JSON.stringify(info.json) : '';
  const length = json.length;
  if (0 < length) {
    headers['content-type'] = 'application/json';
    headers['content-length'] = length;
  }
  const req = remote[location.protocol.slice(0, -1)]
    .request({
      headers: headers,
      hostname: location.hostname,
      method: method,
      path: location.pathname + (search.length < 2 ? '' : search),
      port: location.port
    },
    res => {
      const data = [];
      res
        .setEncoding('utf8')
        .on('error', reject)
        .on('data', chunk => data.push(chunk))
        .on('end', () => {
          const result = {
            headers: res.headers,
            message: res.statusMessage,
            status: res.statusCode,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage
          };
          if (
            data.length &&
            -1 < res.headers['content-type'].indexOf('application/json')
          )
            result.json = JSON.parse(data.join(''));
          else
            result.body = data.join('');
          resolve(result);
        })
      ;
    })
    .on('error', reject);
  if (0 < length)
    req.write(json);
  req.end();
});

const faroff = {};

[
  'CONNECT',
  'DELETE',
  'GET',
  'HEAD',
  'OPTIONS',
  'PATCH',
  'POST',
  'PUT',
  'TRACE'
].forEach(
  method => {
    faroff[method] = 
    faroff[method.toLowerCase()] = (url, info) => (
      typeof url === 'object' ?
        request(method, url.url, url) :
        request(method, url, info || {})
    );
  }
);
module.exports = faroff;
