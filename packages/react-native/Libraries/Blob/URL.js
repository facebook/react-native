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

// Initialize BLOB_URL_PREFIX if NativeBlobModule is available and properly configured
if (
  NativeBlobModule &&
  typeof NativeBlobModule.getConstants().BLOB_URI_SCHEME === 'string'
) {
  const constants = NativeBlobModule.getConstants();
  BLOB_URL_PREFIX = constants.BLOB_URI_SCHEME + ':';
  if (typeof constants.BLOB_URI_HOST === 'string') {
    BLOB_URL_PREFIX += //${constants.BLOB_URI_HOST}/;
  }
}

/*
 * To allow Blobs be accessed via content:// URIs,
 * you need to register BlobProvider as a ContentProvider in your app's AndroidManifest.xml:
 *
 * xml
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
 * xml
 * <resources>
 *   <string name="blob_provider_authority">your.app.package.blobs</string>
 * </resources>
 * 
 */

export {URLSearchParams} from './URLSearchParams';

// Validate the base URL with a regular expression
function validateBaseUrl(url: string): boolean {
  // from this MIT-licensed gist: https://gist.github.com/dperini/729294
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S)?$/.test(
    url,
  );
}

export class URL {
  _url: string;
  _searchParamsInstance: ?URLSearchParams = null;
  _urlObject: URL;

  static createObjectURL(blob: Blob): string {
    if (BLOB_URL_PREFIX === null) {
      throw new Error('Cannot create URL for blob! Ensure NativeBlobModule is properly configured.');
    }
    if (!blob || !blob.data || !blob.data.blobId) {
      throw new Error('Invalid blob data: Missing blobId or data.');
    }
    return ${BLOB_URL_PREFIX}${blob.data.blobId}?offset=${blob.data.offset}&size=${blob.size};
  }

  static revokeObjectURL(url: string) {
    // Do nothing, no implementation needed for revoking Blob URLs in this case.
  }

  constructor(url: string, base: string | URL) {
    let baseUrl = null;

    // Validate URL format and handle base URL correctly
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

      // Ensure correct URL formatting
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

    // Create a URL object for easier parsing (browser-like behavior)
    this._urlObject = new globalThis.URL(this._url);
  }

  get hash(): string {
    return this._urlObject.hash || ''; // Extract the fragment part
  }

  get host(): string {
    return this._urlObject.host || ''; // Extracts the host and port (if present)
  }

  get hostname(): string {
    return this._urlObject.hostname || ''; // Extracts just the hostname (without port)
  }

  get href(): string {
    return this.toString();
  }

  get origin(): string {
    return this._urlObject.origin || ''; // Extracts the origin (protocol + hostname + port)
  }

  get password(): string {
    const match = this._urlObject.href.match(/^.:\/\/(.):(.*)@/);
    return match && match[2] ? match[2] : ''; // Extract password from "username:password" part
  }

  get pathname(): string {
    return this._urlObject.pathname || ''; // Extracts the pathname (e.g., "/path/to/resource")
  }

  get port(): string {
    return this._urlObject.port || ''; // Extracts the port part
  }

  get protocol(): string {
    return this._urlObject.protocol || ''; // Extracts the protocol (e.g., "http:" or "https:")
  }

  get search(): string {
    return this._urlObject.search || ''; // Extracts the query string (e.g., "?id=123")
  }

  get searchParams(): URLSearchParams {
    if (this._searchParamsInstance == null) {
      this._searchParamsInstance = new URLSearchParams(this._urlObject.search);
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
    const instanceString = this._searchParamsInstance.toString();
    const separator = this._url.indexOf('?') > -1 ? '&' : '?';
    return this._url + separator + instanceString;
  }

  get username(): string {
    const match = this._urlObject.href.match(/^.:\/\/(.?)(?::(.*))?@/);
    return match && match[1] ? match[1] : ''; // Extract username from "username:password" part
  }
}