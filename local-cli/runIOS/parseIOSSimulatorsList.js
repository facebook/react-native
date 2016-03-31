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

type IOSSimulatorInfo = {
  name: string;
  udid: string;
  version: string;
}

/**
 * Parses the output of `xcrun simctl list devices` command
 */
function parseIOSSimulatorsList(text: string): Array<IOSSimulatorInfo> {
  const devices = [];
  var currentOS = null;

  text.split('\n').forEach((line) => {
    var section = line.match(/^-- (.+) --$/);
    if (section) {
      var header = section[1].match(/^iOS (.+)$/);
      if (header) {
        currentOS = header[1];
      } else {
        currentOS = null;
      }
      return;
    }

    const device = line.match(/^[ ]*([^()]+) \(([^()]+)\)/);
    if (device && currentOS) {
      var name = device[1];
      var udid = device[2];
      devices.push({udid, name, version: currentOS});
    }
  });

  return devices;
}

module.exports = parseIOSSimulatorsList;
