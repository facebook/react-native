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
'use strict';

type IOSDeviceInfo = {
  name: string;
  udid: string;
  version: string;
}

/**
 * Parses the output of `xcrun simctl list devices` command
 */
function parseIOSDevicesList(text: string): Array<IOSDeviceInfo> {
  const devices = [];
  text.split('\n').forEach((line) => {
    const device = line.match(/(.*?) \((.*?)\) \[(.*?)\]/);
    const noSimulator = line.match(/(.*?) \((.*?)\) \[(.*?)\] \((.*?)\)/);
    if (device != null && noSimulator == null){
      var name = device[1];
      var version = device[2];
      var udid = device[3];
      devices.push({udid, name, version});
    }
  });

  return devices;
}

module.exports = parseIOSDevicesList;
