/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {URL: whatwgUrl} = require('whatwg-url-without-unicode');

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
    throw new Error('not implemented');
  }

  get(name) {
    throw new Error('not implemented');
  }

  getAll(name) {
    throw new Error('not implemented');
  }

  has(name) {
    throw new Error('not implemented');
  }

  set(name, value) {
    throw new Error('not implemented');
  }

  sort() {
    throw new Error('not implemented');
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

whatwgUrl.createObjectURL = function createObjectURL(blob: Blob) {
  if (BLOB_URL_PREFIX === null) {
    throw new Error('Cannot create URL for blob!');
  }
  return `${BLOB_URL_PREFIX}${blob.data.blobId}?offset=${
    blob.data.offset
  }&size=${blob.size}`;
};

whatwgUrl.revokeObjectURL = function revokeObjectURL(url: string) {
  // Do nothing.
};

export const URL = whatwgUrl;
