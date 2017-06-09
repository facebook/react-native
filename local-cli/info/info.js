/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const chalk = require('chalk');
const execSync = require('child_process').execSync;
const os = require('os');
const osName = require('os-name');
const pkg = require('../../package.json');
const yarn = require('../util/yarn');

const info = function() {
  const npmVersion = execSync('npm -v')
    .toString()
    .replace(/(\r\n|\n|\r)/gm, '');

  if (process.platform === 'darwin') {
    var xcodebuildVersion = execSync('/usr/bin/xcodebuild -version')
      .toString()
      .split('\n')
      .join(' ');
  }

  console.log(chalk.bold('Versions:'));
  console.log('  React Native: ', chalk.gray(pkg.version));
  console.log('  OS: ', chalk.gray(osName(os.platform(), os.release())));
  console.log('  Node: ', chalk.gray(process.version));
  console.log('  Yarn: ', chalk.gray(yarn.getYarnVersionIfAvailable()));
  console.log('  npm: ', chalk.gray(npmVersion));
  console.log('  Xcode: ', process.platform === 'darwin' ? chalk.gray(xcodebuildVersion) : 'N/A');
};

module.exports = {
  name: 'info',
  description: 'Get relevant version info about OS, toolchain and libraries',
  func: info,
};