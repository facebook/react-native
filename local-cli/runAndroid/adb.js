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

const child_process = require('child_process');
const chalk = require('chalk');

function getAdbPath() {
  return process.env.ANDROID_HOME
    ? process.env.ANDROID_HOME + '/platform-tools/adb'
    : 'adb';
}

/**
 * Parses the output of the 'adb devices' command
 */
function parseDevicesResult(result: string): Array<string> {
  if (!result) {
    return [];
  }

  const devices = [];
  const lines = result.trim().split(/\r?\n/);

  for (let i=0; i < lines.length; i++) {
    let words = lines[i].split(/[ ,\t]+/).filter((w) => w !== '');

    if (words[1] === 'device') {
      devices.push(words[0]);
    }
  }
  return devices;
}

/**
 * Executes the commands needed to get a list of devices from ADB
 */
function getDevices(extraParams: Array<string>): Array<string> {
  extraParams = extraParams || [];
  const cmd = [getAdbPath(), ...extraParams, 'devices'].join(' ');

  console.log(chalk.bold(
    `Getting devices (${cmd})...`
  ));

  try {
    const devicesResult = child_process.execSync(cmd);
    const result = parseDevicesResult(devicesResult.toString());

    console.log(chalk.bold(
      `Found devices (${result.join(', ')})...`
    ));

    return result;
  } catch (e) {
    return [];
  }


}

module.exports = {
  parseDevicesResult: parseDevicesResult,
  getDevices: getDevices,
  getAdbPath: getAdbPath
};
