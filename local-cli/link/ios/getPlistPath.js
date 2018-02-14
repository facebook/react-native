/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const path = require('path');
const getBuildProperty = require('./getBuildProperty');

module.exports = function getPlistPath(project, sourceDir) {
  const plistFile = getBuildProperty(project, 'INFOPLIST_FILE');

  if (!plistFile) {
    return null;
  }

  return path.join(
    sourceDir,
    plistFile.replace(/"/g, '').replace('$(SRCROOT)', '')
  );
};
