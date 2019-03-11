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
const path = require('path');

module.exports = function findPodfilePath(projectFolder) {
  const podFilePath = path.join(projectFolder, '..', 'Podfile');
  const podFileExists = fs.existsSync(podFilePath);

  return podFileExists ? podFilePath : null;
};
