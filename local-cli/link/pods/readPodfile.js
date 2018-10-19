/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const fs = require('fs');

module.exports = function readPodfile(podfilePath) {
  const podContent = fs.readFileSync(podfilePath, 'utf8');
  return podContent.split(/\r?\n/g);
};
