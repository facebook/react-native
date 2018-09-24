/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const chalk = require('chalk');
const child_process = require('child_process');
const adb = require('../runAndroid/adb');
const prompt = require('../generator/promptSync')();

/**
 * Starts adb logcat
 */
function logAndroid() {
  let deviceList = [];
  let _device_name = "";

  try{
    deviceList = adb.getDevices();
  }catch(e){
    console.log(chalk.red('Coud not get devices list. Do you have adb in your PATH?'));
  }

  if (deviceList.length > 1) {
    console.log(chalk.bold("\r\nMultiple connected devices found, please choose one among them from the list below :\r\n"));
    let counter = 1;
    deviceList.forEach( (dev) => {
      console.log( "   "+dev+ "\t : " + counter);
      counter++;
    });
    console.log("\r\nEnter the number against the device of your choice :");
    const choice = prompt();
    if (!isNaN(choice) && !!deviceList[choice-1]){
      _device_name = deviceList[choice-1];
    }else{
      console.log(chalk.red("Invalid entry. Going ahead without specifying the device."));
  }
    console.log("\r\n");
  }

  return new Promise((resolve, reject) => {
    _logAndroid(resolve, reject, _device_name);
  });

}

function _logAndroid(resolve, reject, _device_name) {
  try {
    const adbPath = process.env.ANDROID_HOME
      ? process.env.ANDROID_HOME + '/platform-tools/adb'
      : 'adb';

    let adbArgs = ['logcat', '*:S', 'ReactNative:V', 'ReactNativeJS:V'];

    if (_device_name.length > 0){
      adbArgs.unshift("-s", _device_name);
    }
    console.log(chalk.bold(`Starting the logger (${adbPath} ${adbArgs.join(' ')})...`));

    const log = child_process.spawnSync(adbPath, adbArgs, {stdio: 'inherit'});

    if (log.error !== null) {
      throw log.error;
    }
  } catch (e) {
    console.log(
      chalk.red('adb invocation failed. Do you have adb in your PATH?'),
    );
    return Promise.reject();
  }
}

module.exports = {
  name: 'log-android',
  description: 'starts adb logcat',
  func: logAndroid,
};
