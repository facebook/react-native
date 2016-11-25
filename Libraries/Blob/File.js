/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule File
 * @flow
 */
'use strict';

const Blob = require('Blob');
const { BlobModule } = require('react-native').NativeModules;

import type { FileProps } from './BlobTypes';

/**
 * The File interface provides information about files.
 */
class File extends Blob {
    /**
   * Construct file instance from blob data from native.
   */
  static create(props: FileProps): File {
    const file = Blob.create(props);
    // Object.setPrototypeOf is not available
    file.__proto__ = File.prototype; // eslint-disable-line no-proto
    Object.defineProperties(file, {
      name: {
        enumerable: true,
        configurable: false,
        writable: false,
        value: props.name,
      },
      lastModified: {
        enumerable: true,
        configurable: false,
        writable: false,
        value: props.lastModified,
      },
    });

    return file;
  }

  /**
   * Create file from a local content URI
   */
  static async fromURI(uri: string): Promise<Blob> {
    const options = await BlobModule.createFromURI(uri);
    return File.create(options);
  }
}

module.exports = File;
