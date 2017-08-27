/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BlobManager
 * @flow
 */

'use strict';

const uuid = require('uuid');
const Blob = require('Blob');
const BlobRegistry = require('BlobRegistry');
const { BlobModule } = require('NativeModules');

import type { BlobData, BlobOptions } from 'BlobTypes';

/**
 * Module to manage blobs
 */
class BlobManager {

  /**
   * Create blob from existing array of blobs.
   */
  static createFromParts(parts: Array<Blob | string>, options?: BlobOptions): Blob {
    const blobId = uuid.v4();
    const items = parts.map(part => {
      if (part instanceof ArrayBuffer || global.ArrayBufferView && part instanceof global.ArrayBufferView) {
        throw new Error('Creating blobs from \'ArrayBuffer\' and \'ArrayBufferView\' are not supported');
      }
      if (part instanceof Blob) {
        return {
          data: part.data,
          type: 'blob',
        };
      } else {
        return {
          data: String(part),
          type: 'string',
        };
      }
    });
    const size = items.reduce((acc, curr) => {
      if (curr.type === 'string') {
        return acc + global.unescape(encodeURI(curr.data)).length;
      } else {
        return acc + curr.data.size;
      }
    }, 0);

    BlobModule.createFromParts(items, blobId);

    return BlobManager.createFromOptions({
      blobId,
      offset: 0,
      size,
      type: options ? options.type : '',
      lastModified: options ? options.lastModified : Date.now(),
    });
  }

  /**
   * Create blob instance from blob data from native.
   * Used internally by modules like XHR, WebSocket, etc.
   */
  static createFromOptions(options: BlobData): Blob {
    BlobRegistry.register(options.blobId);
    return Object.assign(Object.create(Blob.prototype), { data: options });
  }

  /**
   * Deallocate resources for a blob.
   */
  static release(blobId: string) {
    BlobRegistry.unregister(blobId);
    if (BlobRegistry.has(blobId)) {
      return;
    }
    BlobModule.release(blobId);
  }
}

module.exports = BlobManager;
