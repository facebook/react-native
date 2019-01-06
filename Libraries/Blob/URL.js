/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
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
class URL {
  constructor() {
    throw new Error('Creating URL objects is not supported yet.');
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

module.exports = URL;
