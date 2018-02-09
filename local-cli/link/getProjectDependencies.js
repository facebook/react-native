/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const path = require('path');

/**
 * Returns an array of dependencies that should be linked/checked.
 */
module.exports = function getProjectDependencies() {
  const pjson = require(path.join(process.cwd(), './package.json'));
  return Object.keys(pjson.dependencies || {}).filter(name => name !== 'react-native');
};
