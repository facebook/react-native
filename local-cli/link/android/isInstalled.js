/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const fs = require('fs');
const makeBuildPatch = require('./patches/makeBuildPatch');

module.exports = function isInstalled(config, name) {
  const buildGradle = fs.readFileSync(config.buildGradlePath);
  return makeBuildPatch(name).installPattern.test(buildGradle);
};
