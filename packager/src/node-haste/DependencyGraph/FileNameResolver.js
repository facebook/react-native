/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

'use strict';

const path = require('path');

export type Options = {|
  +dirPath: string,
  +doesFileExist: (filePath: string) => boolean,
|};

/**
 * When resolving a single module we want to keep track of the list of paths
 * we tried to find. This class is a way to aggregate all the tries easily.
 */
class FileNameResolver {
  _options: Options;
  _tentativeFileNames: Array<string>;

  constructor(options: Options) {
    this._options = options;
    this._tentativeFileNames = [];
  }

  getTentativeFileNames(): $ReadOnlyArray<string> {
    return this._tentativeFileNames;
  }

  tryToResolveFileName(fileName: string): boolean {
    this._tentativeFileNames.push(fileName);
    const filePath = path.join(this._options.dirPath, fileName);
    return this._options.doesFileExist(filePath);
  }
}

module.exports = FileNameResolver;
