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

/**
 * The File interface provides information about files.
 */
class File extends Blob {
  /**
   * Name of the file.
   */
  get name(): string {
    return this.data.name || '';
  }

  /*
   * Last modified time of the file.
   */
  get lastModified(): number {
    return this.data.lastModified || 0;
  }
}

module.exports = File;
