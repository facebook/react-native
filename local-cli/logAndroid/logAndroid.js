/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const chalk = require('chalk');
const child_process = require('child_process');

/**
 * Starts adb logcat
 */
function logAndroid() {
  return new Promise((resolve, reject) => {
    _logAndroid(resolve, reject);
  });
}

function _logAndroid() {
  try {
    const adbPath = process.env.ANDROID_HOME
      ? process.env.ANDROID_HOME + '/platform-tools/adb'
      : 'adb';

    const adbArgs = ['logcat', '*:S', 'ReactNative:V', 'ReactNativeJS:V'];

    console.log(chalk.bold(
      `Starting the logger (${adbPath} ${adbArgs.join(' ')})...`
    ));

    const log = child_process.spawnSync(adbPath, adbArgs, {stdio: 'inherit'});

    if (log.error !== null) {
      throw log.error;
    }

  } catch (e) {
    console.log(chalk.red(
      'adb invocation failed. Do you have adb in your PATH?'
    ));
    return Promise.reject();
  }
}

module.exports = {
  name: 'log-android',
  description: 'starts adb logcat',
  func: logAndroid,
};
