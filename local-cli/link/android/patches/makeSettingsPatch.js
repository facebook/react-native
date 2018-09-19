/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const path = require('path');
const normalizeProjectName = require('./normalizeProjectName');

module.exports = function makeSettingsPatch(
  name,
  androidConfig,
  projectConfig,
) {
  var projectDir = path.relative(
    path.dirname(projectConfig.settingsGradlePath),
    androidConfig.sourceDir,
  );
  const normalizedProjectName = normalizeProjectName(name);

  return {
    pattern: '\n',
    patch:
      `include ':${normalizedProjectName}'\n` +
      `project(':${normalizedProjectName}').projectDir = ` +
      `new File(rootProject.projectDir, '${projectDir}')\n`,
  };
};
