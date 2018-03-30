/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');

/**
 * Returns an array of dependencies that should be linked/checked.
 */
module.exports = function getProjectDependencies() {
  const pjson = require(path.join(process.cwd(), './package.json'));
  return Object.keys(pjson.dependencies || {}).filter(name => name !== 'react-native');
};
