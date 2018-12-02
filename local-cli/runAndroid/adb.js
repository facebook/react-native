/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

const child_process = require('child_process');

/**
 * Parses the output of the 'adb devices' command
 */
function parseDevicesResult(result: string): Array<string> {
  if (!result) {
    return [];
  }

  const devices = [];
  const lines = result.trim().split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    let words = lines[i].split(/[ ,\t]+/).filter(w => w !== '');

    if (words[1] === 'device') {
      devices.push(words[0]);
    }
  }
  return devices;
}

/**
 * Executes the commands needed to get a list of devices from ADB
 */
function getDevices(): Array<string> {
  try {
    const devicesResult = child_process.execSync('adb devices');
    return parseDevicesResult(devicesResult.toString());
  } catch (e) {
    return [];
  }
}

module.exports = {
  parseDevicesResult: parseDevicesResult,
  getDevices: getDevices,
};
