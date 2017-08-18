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

const path = require('path');
const fs = require('fs');

function findReactNativeScripts(): ?string {
  const executablePath = path.resolve(
    'node_modules',
    '.bin',
    'react-native-scripts'
  );
  if (fs.existsSync(executablePath)) {
    return executablePath;
  }
  return null;
}

module.exports = findReactNativeScripts;
