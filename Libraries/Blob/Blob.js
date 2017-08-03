/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Blob
 * @flow
 */

'use strict';

<<<<<<< HEAD
import type { BlobData, BlobOptions } from './BlobTypes';
=======
const invariant = require('fbjs/lib/invariant');
const uuid = require('uuid');

const { BlobModule } = require('NativeModules');

import type { BlobProps } from 'BlobTypes';
>>>>>>> master

/**
 * Opaque JS representation of some binary data in native.
 *
 * The API is modeled after the W3C Blob API, with one caveat
 * regarding explicit deallocation. Refer to the `close()`
 * method for further details.
 *
 * Example usage in a React component:
 *
 *   class WebSocketImage extends React.Component {
 *      state = {blob: null};
 *      componentDidMount() {
 *        let ws = this.ws = new WebSocket(...);
 *        ws.binaryType = 'blob';
 *        ws.onmessage = (event) => {
 *          if (this.state.blob) {
 *            this.state.blob.close();
 *          }
 *          this.setState({blob: event.data});
 *        };
 *      }
 *      componentUnmount() {
 *        if (this.state.blob) {
 *          this.state.blob.close();
 *        }
 *        this.ws.close();
 *      }
 *      render() {
 *        if (!this.state.blob) {
 *          return <View />;
 *        }
 *        return <Image source={{uri: URL.createObjectURL(this.state.blob)}} />;
 *      }
 *   }
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Blob
 */
class Blob {
<<<<<<< HEAD
  _data: ?BlobData;
=======
  /**
   * Size of the data contained in the Blob object, in bytes.
   */
  size: number;
  /*
   * String indicating the MIME type of the data contained in the Blob.
   * If the type is unknown, this string is empty.
   */
  type: string;

  /*
   * Unique id to identify the blob on native side (non-standard)
   */
  blobId: string;
  /*
   * Offset to indicate part of blob, used when sliced (non-standard)
   */
  offset: number;

  /**
   * Construct blob instance from blob data from native.
   * Used internally by modules like XHR, WebSocket, etc.
   */
  static create(props: BlobProps): Blob {
    return Object.assign(Object.create(Blob.prototype), props);
  }
>>>>>>> master

  /**
   * Constructor for JS consumers.
   * Currently we only support creating Blobs from other Blobs.
   * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob
   */
<<<<<<< HEAD
  constructor(parts: Array<Blob | string> = [], options: BlobOptions) {
    const BlobManager = require('BlobManager');
    this.data = BlobManager.createFromParts(parts, options).data;
=======
  constructor(parts: Array<Blob>, options: any) {
    const blobId = uuid();
    let size = 0;
    parts.forEach((part) => {
      invariant(part instanceof Blob, 'Can currently only create a Blob from other Blobs');
      size += part.size;
    });
    BlobModule.createFromParts(parts, blobId);
    return Blob.create({
      blobId,
      offset: 0,
      size,
    });
>>>>>>> master
  }

  /*
   * This method is used to create a new Blob object containing
   * the data in the specified range of bytes of the source Blob.
   * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Blob/slice
   */
<<<<<<< HEAD
  set data(data: ?BlobData) {
    this._data = data;
  }

  get data(): BlobData {
    if (this._data) {
      return this._data;
    }
    throw new Error('Blob has been closed and is no longer available');
  }

  slice(start?: number, end?: number): Blob {
    const BlobManager = require('BlobManager');
    let { size, offset } = this.data;
=======
  slice(start?: number, end?: number): Blob {
    let offset = this.offset;
    let size = this.size;
>>>>>>> master
    if (typeof start === 'number') {
      if (start > size) {
        start = size;
      }
      offset += start;
      size -= start;

      if (typeof end === 'number') {
        if (end < 0) {
          end = this.size + end;
        }
        size = end - start;
      }
    }
<<<<<<< HEAD
    return BlobManager.createFromOptions({
      blobId: this.data.blobId,
=======
    return Blob.create({
      blobId: this.blobId,
>>>>>>> master
      offset,
      size,
    });
  }

  /**
   * This method is in the standard, but not actually implemented by
   * any browsers at this point. It's important for how Blobs work in
   * React Native, however, since we cannot de-allocate resources automatically,
   * so consumers need to explicitly de-allocate them.
   *
   * Note that the semantics around Blobs created via `blob.slice()`
   * and `new Blob([blob])` are different. `blob.slice()` creates a
   * new *view* onto the same binary data, so calling `close()` on any
   * of those views is enough to deallocate the data, whereas
   * `new Blob([blob, ...])` actually copies the data in memory.
   */
  close() {
<<<<<<< HEAD
    const BlobManager = require('BlobManager');
    BlobManager.release(this.data.blobId);
    this.data = null;
  }

  /**
   * Size of the data contained in the Blob object, in bytes.
   */
  get size(): number {
    return this.data.size;
  }

  /*
   * String indicating the MIME type of the data contained in the Blob.
   * If the type is unknown, this string is empty.
   */
  get type(): string {
    return this.data.type || '';
=======
    BlobModule.release(this.blobId);
>>>>>>> master
  }
}

module.exports = Blob;
