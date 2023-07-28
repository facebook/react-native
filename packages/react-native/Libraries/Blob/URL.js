/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type Blob from './Blob';

import NativeBlobModule from './NativeBlobModule';

let BLOB_URL_PREFIX = null;

if (
  NativeBlobModule &&
  typeof NativeBlobModule.getConstants().BLOB_URI_SCHEME === 'string'
) {
  const constants = NativeBlobModule.getConstants();
  // $FlowFixMe[incompatible-type] asserted above
  // $FlowFixMe[unsafe-addition]
  BLOB_URL_PREFIX = constants.BLOB_URI_SCHEME + ':';
  if (typeof constants.BLOB_URI_HOST === 'string') {
    BLOB_URL_PREFIX += `//${constants.BLOB_URI_HOST}/`;
  }
}

/**
 * To allow Blobs be accessed via `content://` URIs,
 * you need to register `BlobProvider` as a ContentProvider in your app's `AndroidManifest.xml`:
 *
 * ```xml
 * <manifest>
 *   <application>
 *     <provider
 *       android:name="com.facebook.react.modules.blob.BlobProvider"
 *       android:authorities="@string/blob_provider_authority"
 *       android:exported="false"
 *     />
 *   </application>
 * </manifest>
 * ```
 * And then define the `blob_provider_authority` string in `res/values/strings.xml`.
 * Use a dotted name that's entirely unique to your app:
 *
 * ```xml
 * <resources>
 *   <string name="blob_provider_authority">your.app.package.blobs</string>
 * </resources>
 * ```
 */

// Small subset from whatwg-url: https://github.com/jsdom/whatwg-url/tree/master/src
// The reference code bloat comes from Unicode issues with URLs, so those won't work here.
export class URLSearchParams {
  _params: Array<Array<string>> = [];

  constructor(init?: string | {[key: string]: string | string[] | void}) {
    if (typeof init === 'string' && init.trim() !== '') {
      this._parseSearchParams(init.trim());
    } else if (typeof init === 'object') {
      this._searchParamsFromObject(init);
    }
  }

  _parseSearchParams(init: string) {
    if (init.startsWith('?')) {
      init = init.slice(1);
    }

    const pairs = init.split('&');

    for (const pair of pairs) {
      const [key, value] = pair.split('=');

      this.append(decodeURIComponent(key), decodeURIComponent(value));
    }
  }

  _searchParamsFromObject(init: {[key: string]: string | string[] | void}) {
    for (const [key, val] of Object.entries(init)) {
      if (!Array.isArray(val)) {
        this.append(key, val);
        continue;
      }

      for (const value of val) {
        this.append(key, value);
      }
    }
  }

  append(key: string, value: string | void): void {
    key = encodeURIComponent(key);
    value = value ? encodeURIComponent(value) : '';
    this._params.push([key, value]);
  }

  delete(key: string): void {
    key = encodeURIComponent(key);
    this._params = this._params.filter(param => param[0] !== key);
  }

  get(key: string): string | null {
    return this.getAll(key)[0] || null;
  }

  getAll(key: string): Array<string> {
    key = encodeURIComponent(key);
    const pairs = this._params.reduce((acc, cur) => {
      if (cur[0] === key) {
        return [...acc, cur[1]];
      }

      return acc;
    }, ([]: Array<string>));
    return pairs.map(decodeURIComponent);
  }

  has(key: string): boolean {
    key = encodeURIComponent(key);
    return this._params.some(pair => pair[0] === key);
  }

  set(key: string, value: string): void {
    this.delete(key);
    this.append(key, value);
  }

  sort(): void {
    throw new Error('URLSearchParams.sort is not implemented');
  }

  toString(): string {
    if (this._params.length === 0) {
      return '';
    }

    return this._params.map(pair => pair.join('=')).join('&');
  }

  // $FlowFixMe[unsupported-syntax]
  // $FlowFixMe[missing-local-annot]
  [Symbol.iterator]() {
    return this._params[Symbol.iterator]();
  }
}

// function validateBaseUrl(url: string) {
//   // from this MIT-licensed gist: https://gist.github.com/dperini/729294
//   return /^(?:(?:(?:https?|ftp):)?\/\/)(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)*(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/.test(
//     url,
//   );
// }

const DEFAULT_PORTS = Object.freeze({
  https: '443',
  http: '80',
  wss: '443',
  ws: '80',
  ftp: '21',
});

const URL_PATTERN =
  /^(?:(?<protocol>\w+:)\/\/)?(?<hostname>(?:[\w.-]+\.[a-z]{2,})|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(?<port>\d+))?(?<pathname>[/\w.-]*)?(?<search>\?[^#]*)?(?<hash>#.*)?$/;

export class URL {
  _protocol: string;
  _hostname: string;
  _port: string;
  _pathname: string;
  _search: string;
  _hash: string;

  _searchParamsInstance: ?URLSearchParams = null;

  static createObjectURL(blob: Blob): string {
    if (BLOB_URL_PREFIX === null) {
      throw new Error('Cannot create URL for blob!');
    }
    return `${BLOB_URL_PREFIX}${blob.data.blobId}?offset=${blob.data.offset}&size=${blob.size}`;
  }

  static revokeObjectURL(url: string) {
    // Do nothing.
  }

  // $FlowFixMe[missing-local-annot]
  constructor(url: string, base?: string | URL) {
    url = url.trim();

    const urlMatch = url.match(URL_PATTERN);

    if (base && !urlMatch) {
      if (typeof base === 'string') {
        base = new URL(base);
      }

      if (url.startsWith('/')) {
        base.pathname = url;
      } else {
        base.pathname += url;
      }

      this._protocol = base.protocol;
      this._hostname = base.hostname;
      this._port = base.port;
      this._pathname = base.pathname;
      this._search = base.search;
      this._hash = base.hash;
    } else {
      if (!urlMatch || !urlMatch.groups) {
        throw new TypeError('Invalid URL');
      }

      this.href = url;
    }
  }

  get hash(): string {
    return this._hash;
  }

  set hash(newhash: string) {
    newhash = newhash.trim();

    if (!newhash.startsWith('#') && newhash !== '') {
      newhash = '#' + newhash;
    }

    this._hash = newhash;
  }

  get host(): string {
    if (this.port) {
      return `${this._hostname}:${this.port}`;
    }

    return this._hostname;
  }

  set host(newhost: string): void {
    const urlMatch = newhost.trim().match(URL_PATTERN);

    if (!urlMatch || !urlMatch.groups) {
      throw new TypeError('Invalid URL');
    }

    this.hostname = urlMatch.groups.hostname || '';
    this.port = urlMatch.groups.port || '';
  }

  get hostname(): string {
    return this._hostname;
  }

  set hostname(newhostname: string): void {
    this._hostname = newhostname.trim();
  }

  get href(): string {
    return this.toString();
  }

  set href(newurl: string): void {
    const urlMatch = newurl.match(URL_PATTERN);

    if (!urlMatch || !urlMatch.groups) {
      throw new TypeError('Invalid URL');
    }

    this.protocol = urlMatch.groups.protocol || 'http:';
    this.hostname = urlMatch.groups.hostname || '';
    this.port = urlMatch.groups.port || '';
    this.pathname = urlMatch.groups.pathname || '';
    this.search = urlMatch.groups.search || '';
    this.hash = urlMatch.groups.hash || '';
  }

  get origin(): string {
    if (this.protocol) {
      return `${this.protocol}//${this.host}`;
    }

    return this.host;
  }

  get password(): string {
    throw new Error('URL.password is not implemented');
  }

  set password(newpassword: string): string {
    throw new Error('URL.password is not implemented');
  }

  get username(): string {
    throw new Error('URL.username is not implemented');
  }

  set username(newusername: string): string {
    throw new Error('URL.username is not implemented');
  }

  get pathname(): string {
    return this._pathname;
  }

  set pathname(newpathname: string): void {
    newpathname = newpathname.trim();

    if (newpathname === '') {
      this._pathname = '/';
      return;
    }

    if (!newpathname.startsWith('/')) {
      newpathname = '/' + newpathname;
    }

    this._pathname = newpathname;
  }

  get port(): string {
    return this._port;
  }

  set port(newport: string | number) {
    newport = newport.toString().trim();

    if (!newport.match(/^[0-9]+$/g) && newport !== '') {
      return;
    }

    if (DEFAULT_PORTS[this.protocol.replace(/(\w)*/g, '')] === newport) {
      this._port = '';
      return;
    }

    this._port = newport;
  }

  get protocol(): string {
    return this._protocol;
  }

  set protocol(newprotocol: string): void {
    newprotocol = newprotocol.trim().replace(/\/*/g, '');

    if (!newprotocol.endsWith(':')) {
      newprotocol += ':';
    }

    this._protocol = newprotocol;

    if (
      newprotocol in DEFAULT_PORTS &&
      DEFAULT_PORTS[newprotocol.replace(/(\w)*/g, '')] === this.port
    ) {
      this._port = '';
    }
  }

  get search(): string {
    return this._search;
  }

  set search(newsearch: string) {
    this._searchParamsInstance = new URLSearchParams(newsearch.trim());
    this._search = this._searchParamsInstance.toString();
  }

  get searchParams(): URLSearchParams {
    if (this._searchParamsInstance == null) {
      this._searchParamsInstance = new URLSearchParams(this.search);
    }
    return this._searchParamsInstance;
  }

  toJSON(): string {
    return this.toString();
  }

  toString(): string {
    let _href = '';

    if (this.origin) {
      _href += this.origin;
    }

    if (this.pathname) {
      _href += this.pathname;
    }

    if (this.search) {
      _href += '?' + this.search;
    }

    if (this.hash) {
      _href += this.hash;
    }

    return _href;
  }
}
