/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const Blob = require('./Blob');

import NativeBlobModule from './NativeBlobModule';

let BLOB_URL_PREFIX = null;

if (
  NativeBlobModule &&
  typeof NativeBlobModule.getConstants().BLOB_URI_SCHEME === 'string'
) {
  const constants = NativeBlobModule.getConstants();
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

// Small subset from whatwg-url: https://github.com/jsdom/whatwg-url/tree/master/lib
// The reference code bloat comes from Unicode issues with URLs, so those won't work here.
export class URLSearchParams {
  _searchParams = [];

  constructor(params: any) {
    if (typeof params === 'object') {
      Object.keys(params).forEach(key => this.append(key, params[key]));
    }
  }

  append(key: string, value: string) {
    this._searchParams.push([key, value]);
  }

  delete(name) {
    throw new Error('URLSearchParams.delete is not implemented');
  }

  get(name) {
    throw new Error('URLSearchParams.get is not implemented');
  }

  getAll(name) {
    throw new Error('URLSearchParams.getAll is not implemented');
  }

  has(name) {
    throw new Error('URLSearchParams.has is not implemented');
  }

  set(name, value) {
    throw new Error('URLSearchParams.set is not implemented');
  }

  sort() {
    throw new Error('URLSearchParams.sort is not implemented');
  }

  [Symbol.iterator]() {
    return this._searchParams[Symbol.iterator]();
  }

  toString() {
    if (this._searchParams.length === 0) {
      return '';
    }
    const last = this._searchParams.length - 1;
    return this._searchParams.reduce((acc, curr, index) => {
      return acc + curr.join('=') + (index === last ? '' : '&');
    }, '');
  }
}

function validateBaseUrl(url: string) {
  // from this MIT-licensed gist: https://gist.github.com/dperini/729294
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)*(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/.test(
    url,
  );
}

export class URL {
  _searchParamsInstance = null;

  static createObjectURL(blob: Blob) {
    if (BLOB_URL_PREFIX === null) {
      throw new Error('Cannot create URL for blob!');
    }
    return `${BLOB_URL_PREFIX}${blob.data.blobId}?offset=${blob.data.offset}&size=${blob.size}`;
  }

  static revokeObjectURL(url: string) {
    // Do nothing.
  }

  constructor(url: string, base: string) {
    let baseUrl = null;
    if (!base || validateBaseUrl(url)) {
      this._url = url;
      if (!this._url.endsWith('/')) {
        this._url += '/';
      }
    } else {
      if (typeof base === 'string') {
        baseUrl = base;
        if (!validateBaseUrl(baseUrl)) {
          throw new TypeError(`Invalid base URL: ${baseUrl}`);
        }
      } else if (typeof base === 'object') {
        baseUrl = base.toString();
      }
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, baseUrl.length - 1);
      }
      if (!url.startsWith('/')) {
        url = `/${url}`;
      }
      if (baseUrl.endsWith(url)) {
        url = '';
      }
      this._url = `${baseUrl}${url}`;
    }
  }

  get hash() {
    throw new Error('URL.hash is not implemented');
  }

  get host() {
    throw new Error('URL.host is not implemented');
  }

  get hostname() {
    throw new Error('URL.hostname is not implemented');
  }

  get href(): string {
    return this.toString();
  }

  get origin() {
    throw new Error('URL.origin is not implemented');
  }

  get password() {
    throw new Error('URL.password is not implemented');
  }

  get pathname() {
    throw new Error('URL.pathname not implemented');
  }

  get port() {
    throw new Error('URL.port is not implemented');
  }

  get protocol() {
    throw new Error('URL.protocol is not implemented');
  }

  get search() {
    throw new Error('URL.search is not implemented');
  }

  get searchParams(): URLSearchParams {
    if (this._searchParamsInstance == null) {
      this._searchParamsInstance = new URLSearchParams();
    }
    return this._searchParamsInstance;
  }

  toJSON(): string {
    return this.toString();
  }

  toString(): string {
    if (this._searchParamsInstance === null) {
      return this._url;
    }
    const separator = this._url.indexOf('?') > -1 ? '&' : '?';
    return this._url + separator + this._searchParamsInstance.toString();
  }

  get username() {
    throw new Error('URL.username is not implemented');
  }
}
