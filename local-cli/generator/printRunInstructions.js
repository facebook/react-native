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

function printRunInstructions(projectDir, projectName) {
  const absoluteProjectDir = path.resolve(projectDir);
  // iOS
  const xcodeProjectPath = path.resolve(projectDir, 'ios', projectName) + '.xcodeproj';
  const relativeXcodeProjectPath = path.relative(process.cwd(), xcodeProjectPath);
  console.log(chalk.white.bold('To run your app on iOS:'));
  console.log('   cd ' + absoluteProjectDir);
  console.log('   react-native run-ios');
  console.log('   - or -');
  console.log('   Open ' + relativeXcodeProjectPath + ' in Xcode');
  console.log('   Hit the Run button');
  // Android
  console.log(chalk.white.bold('To run your app on Android:'));
  console.log('   cd ' + absoluteProjectDir);
  console.log('   Have an Android emulator running (quickest way to get started), or a device connected');
  console.log('   react-native run-android');
}

module.exports = printRunInstructions;
