'use strict';

const chalk = require('chalk');
const child_process = require('child_process');
const os = require('os');
const path = require('path');
const Promise = require('promise');

/**
 * Starts iOS device syslog tail
 */
function logIOS() {
  return new Promise((resolve, reject) => {
    _logIOS(resolve, reject);
  });
}

function _logIOS() {
  let rawDevices;

  try {
    rawDevices = child_process.execFileSync(
      'xcrun', ['simctl', 'list', 'devices', '--json'], {encoding: 'utf8'}
    );
  } catch (e) {
    console.log(chalk.red(
      'xcrun invocation failed. Please check that Xcode is installed.'
    ));
    return Promise.reject(e);
  }

  const { devices } = JSON.parse(rawDevices);

  const device = _findAvailableDevice(devices);
  if (device === undefined) {
    console.log(chalk.red(
      'No active iOS device found'
    ));
    return Promise.reject();
  }

  return tailDeviceLogs(device.udid);
}

function _findAvailableDevice(devices) {
  for (const key of Object.keys(devices)) {
    for (const device of devices[key]) {
      if (device.availability === '(available)' && device.state === 'Booted') {
        return device;
      }
    }
  }
}

function tailDeviceLogs(udid) {
  const logDir = path.join(
    os.homedir(),
    'Library',
    'Logs',
    'CoreSimulator',
    udid,
    'asl',
  );

  const log =
    child_process.spawnSync('syslog', ['-w', '-F', 'std', '-d', logDir], {stdio: 'inherit'});

  if (log.error !== null) {
    console.log(chalk.red(
      'syslog invocation failed.'
    ));
    return Promise.reject(log.error);
  }
}

module.exports = {
  name: 'log-ios',
  description: 'starts iOS device syslog tail',
  func: logIOS,
};
