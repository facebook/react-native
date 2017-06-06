/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const {relative} = require('path');

declare class OpaqueLocalPath {}
export type LocalPath = OpaqueLocalPath & string;

// FIXME: This function has the shortcoming of potentially returning identical
// paths for two files in different roots.
function toLocalPath(roots: $ReadOnlyArray<string>, absolutePath: string): LocalPath {
  for (let i = 0; i < roots.length; i++) {
    const localPath = relative(roots[i], absolutePath);
    if (localPath[0] !== '.') {
      return (localPath: any);
    }
  }

  throw new Error(
    'Expected root module to be relative to one of the project roots'
  );
}

module.exports = toLocalPath;
