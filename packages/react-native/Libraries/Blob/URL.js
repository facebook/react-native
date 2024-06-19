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
  _searchParams: Array<Array<string>> = [];

  constructor(params: any) {
    if (typeof params === 'object') {
      Object.keys(params).forEach(key => this.append(key, params[key]));
    }
  }

  append(key: string, value: string): void {
    this._searchParams.push([key, value]);
  }

  delete(name: string): void {
    throw new Error('URLSearchParams.delete is not implemented');
  }

  get(name: string): void {
    throw new Error('URLSearchParams.get is not implemented');
  }

  getAll(name: string): void {
    throw new Error('URLSearchParams.getAll is not implemented');
  }

  has(name: string): void {
    throw new Error('URLSearchParams.has is not implemented');
  }

  set(name: string, value: string): void {
    throw new Error('URLSearchParams.set is not implemented');
  }

  sort(): void {
    throw new Error('URLSearchParams.sort is not implemented');
  }

  // $FlowFixMe[unsupported-syntax]
  // $FlowFixMe[missing-local-annot]
  [Symbol.iterator]() {
    return this._searchParams[Symbol.iterator]();
  }

  toString(): string {
    if (this._searchParams.length === 0) {
      return '';
    }
    const last = this._searchParams.length - 1;
    return this._searchParams.reduce((acc, curr, index) => {
      return (
        acc +
        encodeURIComponent(curr[0]) +
        '=' +
        encodeURIComponent(curr[1]) +
        (index === last ? '' : '&')
      );
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
  _url: string;
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

  constructor(url: string, base?: string | URL) {
    if (!base || validateBaseUrl(url)) {
      this._url = encodeURI(url);
    } else {
      if (typeof base === 'string') {
        base = new URL(base);
      }
      this._url = resolveRelativeUrl(url, base.href);
    }

    const pathEndIndex = this._url.indexOf('/', this._url.indexOf('//') + 2);
    if (pathEndIndex === -1) {
      this._url += '/';
    }
  }

  get hash(): string {
    const hashIndex = this._url.indexOf('#');
    return hashIndex !== -1
      ? this._url.substring(hashIndex).replace(/\/$/, '')
      : '';
  }

  get host(): string {
    const hostStart = this._url.indexOf('//') + 2;
    const hostEnd = this._url.indexOf('/', hostStart);
    return hostEnd !== -1
      ? this._url.substring(hostStart, hostEnd)
      : this._url.substring(hostStart);
  }

  get hostname(): string {
    return this.host.split(':')[0];
  }

  get href(): string {
    return this._url;
  }

  get origin(): string {
    const portIndex = this._url.indexOf(':', this._url.indexOf('//') + 2);
    const originEnd =
      portIndex !== -1
        ? this._url.indexOf('/', portIndex)
        : this._url.indexOf('/', this._url.indexOf('//') + 2);
    return originEnd !== -1 ? this._url.substring(0, originEnd) : this._url;
  }

  get password(): string {
    const atIndex = this._url.indexOf('@');
    if (atIndex !== -1) {
      const userinfo = this._url.substring(
        this._url.indexOf('//') + 2,
        atIndex,
      );
      return userinfo.includes(':') ? userinfo.split(':')[1] : '';
    }
    return '';
  }

  get pathname(): string {
    const pathStart = this._url.indexOf('/', this._url.indexOf('//') + 2);
    const pathEnd = this._url.indexOf('?', pathStart);

    let pathname =
      pathStart !== -1
        ? pathEnd !== -1
          ? this._url.substring(pathStart, pathEnd)
          : this._url.substring(pathStart)
        : '/';

    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    return pathname;
  }

  get port(): string {
    const host = this.host;
    const portIndex = host.indexOf(':');
    return portIndex !== -1 && portIndex < host.length - 1
      ? host.substring(portIndex + 1)
      : '';
  }

  get protocol(): string {
    return this._url.substring(0, this._url.indexOf(':') + 1);
  }

  get search(): string {
    const searchIndex = this._url.indexOf('?');
    const hashIndex = this._url.indexOf('#');
    if (searchIndex !== -1) {
      return (
        hashIndex !== -1
          ? this._url.substring(searchIndex, hashIndex)
          : this._url.substring(searchIndex)
      ).replace(/\/$/, '');
    }
    return '';
  }

  get searchParams(): URLSearchParams {
    if (this._searchParamsInstance == null) {
      this._searchParamsInstance = new URLSearchParams();
    }
    return this._searchParamsInstance;
  }

  get username(): string {
    const atIndex = this._url.indexOf('@');
    if (atIndex !== -1) {
      const userinfo = this._url.substring(
        this._url.indexOf('//') + 2,
        atIndex,
      );
      return userinfo.includes(':') ? userinfo.split(':')[0] : userinfo;
    }
    return '';
  }

  toJSON(): string {
    return JSON.stringify({
      href: this.href,
      origin: this.origin,
      protocol: this.protocol,
      username: this.username,
      password: this.password,
      host: this.host,
      hostname: this.hostname,
      port: this.port,
      pathname: this.pathname,
      search: this.search,
      searchParams: this.searchParams.toString(),
      hash: this.hash,
    });
  }

  toString(): string {
    return this.href;
  }
}

function resolveRelativeUrl(relative: string, base: string): string {
  const baseUrl = new URL(base);
  if (relative.startsWith('/')) {
    return `${baseUrl.origin}${relative}`;
  }

  let basePath = baseUrl.pathname;
  if (!basePath.endsWith('/')) {
    basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1);
  }

  const baseParts = basePath.split('/').filter(part => part.length > 0);
  const relativeParts = relative.split('/').filter(part => part.length > 0);

  const paths = baseParts.concat(relativeParts);
  const resolvedParts = [];

  for (const path of paths) {
    if (path === '..') {
      resolvedParts.pop();
    } else if (path !== '.') {
      resolvedParts.push(path);
    }
  }

  const resolvedPath = resolvedParts.join('/');
  return `${baseUrl.origin}/${resolvedPath}`;
}
