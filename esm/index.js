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

const http = require('http');
const https = require('https');

const URLSearchParams = require('url-search-params');

// dehihi
const re = /^(?:post|put)$/;
const mote = {
  http: http,
  https: https
};

const request = (method, where, data, headers) => {
  const url = require('url').parse(where);
  const params = new URLSearchParams(url.search);
  if (!re.test(method) && data != null)
    Object.keys(data).forEach(key => params.append(key, data[key]));
  const search = '?' + params;
  const path = url.pathname + (search.length < 2 ? '' : search);
  return grab(method, path, url, headers, data);
};

const grab = (method, path, url, headers, data) =>
  new Promise((resolve, reject) => {
    const defaultHeaders = {'User-Agent': 'curl/7.54.0'};
    const json = re.test(method) && data != null ? JSON.stringify(data) : '';
    const length = json.length;
    if (0 < length) {
      defaultHeaders['content-type'] = 'application/json';
      defaultHeaders['content-length'] = length;
    }
    const req = mote[url.protocol.slice(0, -1)]
      .request({
        headers: Object.assign(defaultHeaders, headers),
        hostname: url.hostname,
        method: method.toUpperCase(),
        path: path,
        port: url.port
      },
      res => {
        const data = [];
        res
          .setEncoding('utf8')
          .on('error', reject)
          .on('data', chunk => data.push(chunk))
          .on('end', () => resolve({
            headers: res.headers,
            json: data.length ? JSON.parse(data.join('')) : null
          }))
        ;
      })
      .on('error', reject);
    if (0 < length)
      req.write(json);
    req.end();
  });

const faroff = {
  connect: (where, data, headers) => request('connect', where, data, headers),
  delete: (where, data, headers) => request('delete', where, data, headers),
  get: (where, data, headers) => request('get', where, data, headers),
  head: (where, data, headers) => request('head', where, data, headers),
  options: (where, data, headers) => request('options', where, data, headers),
  patch: (where, data, headers) => request('patch', where, data, headers),
  post: (where, data, headers) => request('post', where, data, headers),
  put: (where, data, headers) => request('put', where, data, headers),
  trace: (where, data, headers) => request('trace', where, data, headers)
};
export default faroff;
