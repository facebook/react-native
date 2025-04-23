/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import typeof BlobT from './Blob';
import type {BlobCollector, BlobData, BlobOptions} from './BlobTypes';

import NativeBlobModule from './NativeBlobModule';
import invariant from 'invariant';

const Blob: BlobT = require('./Blob').default;
const BlobRegistry = require('./BlobRegistry');

/*eslint-disable no-bitwise */
/*eslint-disable eqeqeq */

/**
 * Based on the rfc4122-compliant solution posted at
 * http://stackoverflow.com/questions/105034
 */
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// **Temporary workaround**
// TODO(#24654): Use turbomodules for the Blob module.
// Blob collector is a jsi::HostObject that is used by native to know
// when the a Blob instance is deallocated. This allows to free the
// underlying native resources. This is a hack to workaround the fact
// that the current bridge infra doesn't allow to track js objects
// deallocation. Ideally the whole Blob object should be a jsi::HostObject.
function createBlobCollector(blobId: string): BlobCollector | null {
  if (global.__blobCollectorProvider == null) {
    return null;
  } else {
    return global.__blobCollectorProvider(blobId);
  }
}

/**
 * Module to manage blobs. Wrapper around the native blob module.
 */
class BlobManager {
  /**
   * If the native blob module is available.
   */
  static isAvailable: boolean = !!NativeBlobModule;

  /**
   * Create blob from existing array of blobs.
   */
  static createFromParts(
    parts: Array<Blob | string>,
    options?: BlobOptions,
  ): Blob {
    invariant(NativeBlobModule, 'NativeBlobModule is available.');

    const blobId = uuidv4();
    const items = parts.map(part => {
      if (part instanceof ArrayBuffer || ArrayBuffer.isView(part)) {
        throw new Error(
          "Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported",
        );
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

    NativeBlobModule.createFromParts(items, blobId);

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
    // $FlowFixMe[prop-missing]
    return Object.assign(Object.create(Blob.prototype), {
      data:
        // Reuse the collector instance when creating from an existing blob.
        // This will make sure that the underlying resource is only deallocated
        // when all blobs that refer to it are deallocated.
        options.__collector == null
          ? {
              ...options,
              __collector: createBlobCollector(options.blobId),
            }
          : options,
    });
  }

  /**
   * Deallocate resources for a blob.
   */
  static release(blobId: string): void {
    invariant(NativeBlobModule, 'NativeBlobModule is available.');

    BlobRegistry.unregister(blobId);
    if (BlobRegistry.has(blobId)) {
      return;
    }
    NativeBlobModule.release(blobId);
  }

  /**
   * Inject the blob content handler in the networking module to support blob
   * requests and responses.
   */
  static addNetworkingHandler(): void {
    invariant(NativeBlobModule, 'NativeBlobModule is available.');

    NativeBlobModule.addNetworkingHandler();
  }

  /**
   * Indicate the websocket should return a blob for incoming binary
   * messages.
   */
  static addWebSocketHandler(socketId: number): void {
    invariant(NativeBlobModule, 'NativeBlobModule is available.');

    NativeBlobModule.addWebSocketHandler(socketId);
  }

  /**
   * Indicate the websocket should no longer return a blob for incoming
   * binary messages.
   */
  static removeWebSocketHandler(socketId: number): void {
    invariant(NativeBlobModule, 'NativeBlobModule is available.');

    NativeBlobModule.removeWebSocketHandler(socketId);
  }

  /**
   * Send a blob message to a websocket.
   */
  static sendOverSocket(blob: Blob, socketId: number): void {
    invariant(NativeBlobModule, 'NativeBlobModule is available.');

    NativeBlobModule.sendOverSocket(blob.data, socketId);
  }
}

export default BlobManager;
