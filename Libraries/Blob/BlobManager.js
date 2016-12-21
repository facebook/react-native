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
const File = require('File');
const { BlobModule } = require('NativeModules');

import type { BlobData, BlobOptions } from './BlobTypes';

function countUTF8Bytes(s: string){
    let b = 0;
    for (let i = 0, c; c = s.charCodeAt(i++); b += c >> 11 ? 3 : c >> 7 ? 2 : 1) {}
    return b;
}

/**
 * Module to manage blobs
 */
class BlobManager {

  /**
   * Create blob from existing array of blobs.
   */
  static createFromParts(parts: Array<Blob | string>, options: BlobOptions): Blob {
    let blobId = uuid.v4();
    let size = 0;
    parts.forEach((part) => {
      if (typeof part === 'string') {
        size += countUTF8Bytes(part);
      } else if (part instanceof Blob) {
        size += part.size;
      } else {
        throw new Error('Can currently only create a Blob from other Blobs or strings');
      }
    });
    BlobModule.createFromParts(parts.map(part => {
      let type, data;
      if (part instanceof Blob) {
        type = 'blob';
        data = part.data;
      } else {
        type = typeof part;
        data = part;
      }
      return { type, data };
    }), blobId);
    return BlobManager.createFromOptions({
      blobId,
      offset: 0,
      size,
      type: options ? options.type : '',
    });
  }

  /**
   * Create blob instance from blob data from native.
   * Used internally by modules like XHR, WebSocket, etc.
   */
  static createFromOptions(options: BlobData): Blob {
    return Object.assign(Object.create(Blob.prototype), { data: options });
  }

  /**
   * Create file instance from a local content URI
   */
  static async createFromURI(uri: string, options?: { type: string }): Promise<File> {
    const blob = await BlobModule.createFromURI(uri);
    if (options && typeof options.type === 'string') {
      blob.type = options.type;
    }
    return Object.assign(Object.create(File.prototype), { data: blob });
  }

  /**
   * Deallocate resources for a blob.
   */
  static release(blobId: string) {
    return BlobModule.release(blobId);
  }
}

module.exports = BlobManager;
