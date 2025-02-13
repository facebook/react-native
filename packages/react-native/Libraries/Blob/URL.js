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
import {match} from "hermes-transform/dist/traverse/esquery";
import {tsThisType} from "@babel/types";
function getDefaultPort(protocol) {
  switch (protocol) {
    case 'http':
      return 80;
    case 'https':
      return 443;
    case 'ftp':
      return 21;
    case 'smtp':
      return 25;
    case 'pop3':
      return 110;
    case 'imap':
      return 143;
    case 'mysql':
      return 3306;
    // Add more protocols and their default ports as needed
    default:
      return null; // Unknown protocol
  }
}
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

  // $FlowFixMe[missing-local-annot]
  constructor(url: string, base: string | URL) {
    let baseUrl = null;
    if (!base || validateBaseUrl(url)) {
      this._url = url;
      if (!this._url.endsWith('/') && this.search==="") {
        this._url += '/';
      }
    } else {
      if (typeof base === 'string') {
        baseUrl = base;
        if (!validateBaseUrl(baseUrl)) {
          throw new TypeError(`Invalid base URL: ${baseUrl}`);
        }
      } else {
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

  get hash(): string {
    return this.href.match(/#(.*)$/g)?this.href.match(/#(.*)$/g)[0]:""
  }

  get host(): string {
    return this.hostname+(this.port!==""?(":"+this.port):"")
  }

  get hostname(): string {
    return this.href.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/(?:[^@]*@)?([^\/:]+)/)?this.href.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/(?:[^@]*@)?([^\/:]+)/)[1]:""
  }

  get href(): string {
    return this.toString();
  }

  get origin(): string {
    return this.protocol+"://"+this.host

  }

  get password(): string {
    return  this.href.match( /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/[^:]+:([^@]+)@/)?this.href.match( /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/[^:]+:([^@]+)@/)[1]:"";
  }

  get pathname(): string {
    return this.href.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/[^\/]+(\/[^?#]*)/)?this.href.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/[^\/]+(\/[^?#]*)/)[1]:""
  }

  get port(): string {
    let match = this.href.match(/:[0-9]+/g)
    if (match===null || parseInt(match[0].slice(1))===getDefaultPort(this.protocol)){
          return ""
    }
    return match[0].slice(1)
  }

  get protocol(): string {
    return this.href.match(/^([a-z]+):/g)?this.href.match(/^([a-z]+):/g)[0].slice(0,-1):""
  }

  get search(): string {
    return  this.href.match(/\?(.)+$/g)?this.href.match(/\?(.)+$/g)[0]:"";
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
    // $FlowFixMe[incompatible-use]
    const instanceString = this._searchParamsInstance.toString();
    const separator = this._url.indexOf('?') > -1 ? '&' : '?';
    return this._url + separator + instanceString;
  }

  get username(): string {
    return this.href.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/([^:]+)@/)?this.href.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/([^:]+)@/)[1]:"";
  }
}
