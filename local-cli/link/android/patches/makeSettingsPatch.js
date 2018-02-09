/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const path = require('path');
const isWin = process.platform === 'win32';

module.exports = function makeSettingsPatch(name, androidConfig, projectConfig) {
  var projectDir = path.relative(
    path.dirname(projectConfig.settingsGradlePath),
    androidConfig.sourceDir
  );

  /*
   * Fix for Windows
   * Backslashes is the escape character and will result in
   * an invalid path in settings.gradle
   * https://github.com/rnpm/rnpm/issues/113
   */
  if (isWin) {
    projectDir = projectDir.replace(/\\/g, '/');
  }

  return {
    pattern: '\n',
    patch: `include ':${name}'\n` +
      `project(':${name}').projectDir = ` +
      `new File(rootProject.projectDir, '${projectDir}')\n`,
  };
};
