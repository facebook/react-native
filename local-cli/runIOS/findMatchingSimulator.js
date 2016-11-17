/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.*
 */
'use strict';

/**
 * Takes in a parsed simulator list and a desired name, and returns an object with the matching simulator.
 *
 * If the simulatorName argument is null, we'll go into default mode and return the currently booted simulator, or if
 * none is booted, it will be the first in the list.
 *
 * @param Object simulators a parsed list from `xcrun simctl list --json devices` command
 * @param String|null simulatorName the string with the name of desired simulator. If null, it will use the currently
 *        booted simulator, or if none are booted, the first in the list.
 * @returns {Object} {udid, name, version}
 */
function findMatchingSimulator(simulators, simulatorName) {
  if (!simulators.devices) {
    return null;
  }
  const devices = simulators.devices;
  var match;
  for (let version in devices) {
    // Making sure the version of the simulator is an iOS (Removes Apple Watch, etc)
    if (version.indexOf('iOS') !== 0) {
      continue;
    }
    for (let i in devices[version]) {
      let simulator = devices[version][i];
      // Skipping non-available simulator
      if (simulator.availability !== '(available)') {
        continue;
      }
      // If there is a booted simulator, we'll use that as instruments will not boot a second simulator
      if (simulator.state === 'Booted') {
        if (simulatorName !== null) {
          console.warn("We couldn't boot your defined simulator due to an already booted simulator. We are limited to one simulator launched at a time.");
        }
        return {
          udid: simulator.udid,
          name: simulator.name,
          version
        };
      }
      if (simulator.name === simulatorName) {
        return {
          udid: simulator.udid,
          name: simulator.name,
          version
        };
      }
      // Keeps track of the first available simulator for use if we can't find one above.
      if (simulatorName === null && !match) {
        match = {
          udid: simulator.udid,
          name: simulator.name,
          version
        };
      }
    }
  }
  if (match) {
    return match;
  }
  return null;
}

module.exports = findMatchingSimulator;
