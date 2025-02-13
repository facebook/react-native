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
    BLOB_URL_PREFIX += //${constants.BLOB_URI_HOST}/;
  }
}

/*
 * To allow Blobs be accessed via content:// URIs,
 * you need to register BlobProvider as a ContentProvider in your app's AndroidManifest.xml:
 *
 * 
xml
 * <manifest>
 *   <application>
 *     <provider
 *       android:name="com.facebook.react.modules.blob.BlobProvider"
 *       android:authorities="@string/blob_provider_authority"
 *       android:exported="false"
 *     />
 *   </application>
 * </manifest>
 *

 * And then define the blob_provider_authority string in res/values/strings.xml.
 * Use a dotted name that's entirely unique to your app:
 *
 * 
xml
 * <resources>
 *   <string name="blob_provider_authority">your.app.package.blobs</string>
 * </resources>
 *

 */

export {URLSearchParams} from './URLSearchParams';

function validateBaseUrl(url: string) {
  // from this MIT-licensed gist: https://gist.github.com/dperini/729294
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)*(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/.test(
    url,
  );
}


export class URL {
  _url: string;
  _parsedUrl: URL | null = null;

  // Utility to parse the URL once and reuse the parsed object
  _ensureParsed() {
    if (!this._parsedUrl) {
      try {
        this._parsedUrl = new window.URL(this._url);
      } catch (error) {
        throw new Error(Invalid URL: ${this._url});
      }
    }
  }

  constructor(url: string, base: string | URL) {
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
          throw new TypeError(Invalid base URL: ${baseUrl});
        }
      } else {
        baseUrl = base.toString();
      }
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, baseUrl.length - 1);
      }
      if (!url.startsWith('/')) {
        url = /${url};
      }
      if (baseUrl.endsWith(url)) {
        url = '';
      }
      this._url = ${baseUrl}${url};
    }
  }

  get hash(): string {
    this._ensureParsed();
    return this._parsedUrl.hash;
  }

  get host(): string {
    this._ensureParsed();
    return this._parsedUrl.host;
  }

  get hostname(): string {
    this._ensureParsed();
    return this._parsedUrl.hostname;
  }

  get href(): string {
    return this.toString();
  }

  get origin(): string {
    this._ensureParsed();
    return this._parsedUrl.origin;
  }

  get password(): string {
    this._ensureParsed();
    return this._parsedUrl.password;
  }

  get pathname(): string {
    this._ensureParsed();
    return this._parsedUrl.pathname;
  }

  get port(): string {
    this._ensureParsed();
    return this._parsedUrl.port;
  }

  get protocol(): string {
    this._ensureParsed();
    return this._parsedUrl.protocol;
  }

  get search(): string {
    this._ensureParsed();
    return this._parsedUrl.search;
  }

  get searchParams(): URLSearchParams {
    if (!this._searchParamsInstance) {
      this._ensureParsed();
      this._searchParamsInstance = new URLSearchParams(this._parsedUrl.searchParams);
    }
    return this._searchParamsInstance;
  }

  get username(): string {
    this._ensureParsed();
    return this._parsedUrl.username;
  }

  toJSON(): string {
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
}