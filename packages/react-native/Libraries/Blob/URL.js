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

/*
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

export {URLSearchParams} from './URLSearchParams';

function resolveRelativeUrl(relative: string, base: string): string {
  const baseUrl = new URL(base);

  if (relative.startsWith('http://') || relative.startsWith('https://')) {
    return relative;
  }

  if (relative.startsWith('/')) {
    return baseUrl.protocol + '//' + baseUrl.host + encodeURI(relative);
  }

  const baseParts = baseUrl.pathname.split('/');
  const relativeParts = relative.split('/');

  baseParts.pop();

  for (const part of relativeParts) {
    if (part === '.') continue;
    if (part === '..') baseParts.pop();
    else baseParts.push(part);
  }

  return baseUrl.protocol + '//' + baseUrl.host + baseParts.join('/');
}

export class URL {
  protocol: string;
  username: string;
  password: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
  _url: string;
  _searchParamsInstance: ?URLSearchParams = null;

  constructor(url: string, base?: string | URL) {
    if (base) {
      if (typeof base === 'string') {
        base = new URL(base);
      }
      url = resolveRelativeUrl(url, base.href);
    } else {
      url = encodeURI(url);
    }

    const parser = this.parseURL(url);
    this._url = url;
    this.protocol = parser.protocol;
    this.username = parser.username;
    this.password = parser.password;
    this.host = parser.host;
    this.hostname = parser.hostname;
    this.port = parser.port;
    this.pathname = parser.pathname;
    this.search = parser.search;
    this.hash = parser.hash;
    this.origin = parser.origin;

    if (this.pathname === '/' && !this.href.endsWith('/')) {
      this._url += '/';
    }

    this._searchParamsInstance = new URLSearchParams(this.search);
  }

  parseURL(url: string): {
    protocol: string,
    username: string,
    password: string,
    host: string,
    hostname: string,
    port: string,
    pathname: string,
    search: string,
    hash: string,
    origin: string,
  } {
    const urlPattern =
      /^(https?:\/\/)?(([^:\/?#]*)(?::([^:\/?#]*))?@)?([^:\/?#]*)(?::(\d+))?((?:\/[^?#]*)*)(\?[^#]*)?(#.*)?$/;

    const matches = url.match(urlPattern);

    return {
      protocol: matches?.[1] ? matches[1].slice(0, -2) : '',
      username: matches?.[3] || '',
      password: matches?.[4] || '',
      host: matches?.[6] ? matches[5] + ':' + matches[6] : matches?.[5] || '',
      hostname: matches?.[5] || '',
      port: matches?.[6] || '',
      pathname: matches?.[7] || '/',
      search: matches?.[8] || '',
      hash: matches?.[9] || '',
      origin: matches?.[1] ? matches[1] + matches[5] : '',
    };
  }

  get searchParams(): URLSearchParams {
    if (this._searchParamsInstance == null) {
      this._searchParamsInstance = new URLSearchParams();
    }
    return this._searchParamsInstance;
  }

  get href(): string {
    return this.toString();
  }

  toString(): string {
    if (this._searchParamsInstance === null) {
      return this._url;
    }
    const instanceString = this._searchParamsInstance.toString();
    const separator = this._url.indexOf('?') > -1 ? '&' : '?';
    return this._url + separator + instanceString;
  }

  toJSON(): string {
    return this.toString();
  }
}
