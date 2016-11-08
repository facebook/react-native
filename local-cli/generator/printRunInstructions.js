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
  const absoluteAppRoot = path.resolve(appRoot);
  const relativeAppRoot = path.relative(process.cwd(), absoluteAppRoot);
  // If we're in the project directory already, no need to 'cd' into it
  const needToCd = !!relativeAppRoot;
  // iOS
  const xcodeProjectPath = path.resolve(appRoot, 'ios', newProjectName) + '.xcodeproj';
  const relativeXcodeProjectPath = path.relative(process.cwd(), xcodeProjectPath);
  console.log(chalk.white.bold('To run your app on iOS:'));
  if (needToCd) { console.log('   cd ' + relativeAppRoot); }
  console.log('   react-native run-ios');
  console.log('   - or -');
  console.log('   Open ' + relativeXcodeProjectPath + ' in Xcode');
  console.log('   Hit the Run button');
  // Android
  console.log(chalk.white.bold('To run your app on Android:'));
  console.log('   Have an Android emulator running (quickest way to get started), or a device connected');
  if (needToCd) { console.log('   cd ' + relativeAppRoot); }
  console.log('   react-native run-android');
}

module.exports = printRunInstructions;
