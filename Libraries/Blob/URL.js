/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const Blob = require('Blob');

const {BlobModule} = require('NativeModules');

let BLOB_URL_PREFIX = null;

if (BlobModule && typeof BlobModule.BLOB_URI_SCHEME === 'string') {
  BLOB_URL_PREFIX = BlobModule.BLOB_URI_SCHEME + ':';
  if (typeof BlobModule.BLOB_URI_HOST === 'string') {
    BLOB_URL_PREFIX += `//${BlobModule.BLOB_URI_HOST}/`;
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
 *       android:name='com.facebook.react.modules.blob.BlobProvider'
 *       android:authorities='@string/blob_provider_authority'
 *       android:exported='false'
 *     />
 *   </application>
 * </manifest>
 * ```
 * And then define the `blob_provider_authority` string in `res/values/strings.xml`.
 * Use a dotted name that's entirely unique to your app:
 *
 * ```xml
 * <resources>
 *   <string name='blob_provider_authority'>your.app.package.blobs</string>
 * </resources>
 * ```
 */

// Small subset from whatwg-url: https://github.com/jsdom/whatwg-url/tree/master/lib
// The reference code bloat comes from Unicode issues with URLs, so those won't work here.
export class URLSearchParams {
  searchParams = [];

  constructor(params: any) {
    if (typeof params === 'object') {
      Object.keys(params).forEach(key => this.append(key, params[key]));
    }
  }

  append(key: string, value: string) {
    this.searchParams.push([key, value]);
  }

  get paramString() {
    if (this.searchParams.length === 0) {
      return '';
    }
    const last = this.searchParams.length - 1;
    return this.searchParams.reduce((acc, curr, index) => {
      return acc + curr.join('=') + (index === last ? '' : '&');
    }, '');
  }

  [Symbol.iterator]() {
    return this.searchParams[Symbol.iterator]();
  }

  toString() {
    return this.paramString;
  }
}

export class URL {
  _searchParamsInstance = null;
  static urlRegexp = /^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/;

  static validateBaseUrl(url: string) {
    // from this MIT-licensed gist: https://gist.github.com/dperini/729294
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(
      url,
    );
  }

  constructor(url: string, base: string) {
    let baseUrl = null;
    if (base) {
      if (typeof base === 'string') {
        baseUrl = base;
        if (!URL.validateBaseUrl(baseUrl)) {
          throw new TypeError(`Invalid base URL: ${baseUrl}`);
        }
      } else if (typeof base === 'object') {
        baseUrl = base.toString();
      }
      if (baseUrl.endsWith('/') && url.startsWith('/')) {
        baseUrl = baseUrl.slice(0, baseUrl.length - 1);
      }
      if (baseUrl.endsWith(url)) {
        url = '';
      }
      this._url = `${baseUrl}${url}`;
    } else {
      this._url = url;
      if (!this._url.endsWith('/')) {
        this._url += '/';
      }
    }
  }

  get href(): string {
    return this.toString();
  }

  toJSON(): string {
    return this.toString();
  }

  get origin() {
    throw new Error('not implemented');
  }

  get username() {
    throw new Error('not implemented');
  }

  get password() {
    throw new Error('not implemented');
  }

  get hostname() {
    throw new Error('not implemented');
  }

  get port() {
    throw new Error('not implemented');
  }

  get protocol() {
    throw new Error('not implemented');
  }

  get host() {
    throw new Error('not implemented');
  }

  get pathname() {
    throw new Error('not implemented');
  }

  get search() {
    throw new Error('not implemented');
  }

  get hash() {
    throw new Error('not implemented');
  }

  toString(): string {
    if (this._searchParamsInstance === null) {
      return this._url;
    }
    const separator = this._url.indexOf('?') > -1 ? '&' : '?';
    return this._url + separator + this._searchParamsInstance.paramString;
  }

  get searchParams(): URLSearchParams {
    if (this._searchParamsInstance == null) {
      this._searchParamsInstance = new URLSearchParams();
    }
    return this._searchParamsInstance;
  }

  static createObjectURL(blob: Blob) {
    if (BLOB_URL_PREFIX === null) {
      throw new Error('Cannot create URL for blob!');
    }
    return `${BLOB_URL_PREFIX}${blob.data.blobId}?offset=${
      blob.data.offset
    }&size=${blob.size}`;
  }

  static revokeObjectURL(url: string) {
    // Do nothing.
  }
}
