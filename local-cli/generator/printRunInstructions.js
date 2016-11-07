/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var chalk = require('chalk');
var path = require('path');

function printRunInstructions(appRoot, newProjectName) {
  // iOS  
  console.log(chalk.white.bold('To run your app on iOS:'));
  console.log(chalk.white('   cd ' + appRoot));
  console.log(chalk.white('   react-native run-ios'));
  console.log(chalk.white('   - or -'));
  console.log(chalk.white('   Open ' + path.resolve(appRoot, 'ios', newProjectName) + '.xcodeproj in Xcode'));
  console.log(chalk.white('   Hit the Run button'));
  // Android
  console.log(chalk.white.bold('To run your app on Android:'));
  console.log(chalk.white('   Have an Android emulator running (quickest way to get started), or a device connected'));
  console.log(chalk.white('   cd ' + appRoot));
  console.log(chalk.white('   react-native run-android'));
}

module.exports = printRunInstructions;
