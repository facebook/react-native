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
const child_process = require('child_process');
const execSync = child_process.execSync;
const os = require('os');
const osName = require('os-name');
const pkg = require('../../package.json');
const yarn = require('../util/yarn');

const info = function() {
  let androidStudioVersion;
  const npmVersion = execSync('npm -v').toString().replace(/(\r\n|\n|\r)/gm, '');

  if (process.platform === 'darwin') {
    var xcodebuildVersion = execSync('/usr/bin/xcodebuild -version').toString().split('\n').join(' ');

    androidStudioVersion = child_process
      .execFileSync(
        '/usr/libexec/PlistBuddy',
        [
          '-c', 'Print:CFBundleShortVersionString',
          '-c', 'Print:CFBundleVersion',
          '/Applications/Android Studio.app/Contents/Info.plist',
        ],
        { encoding: 'utf8' },
      )
      .split('\n')
      .join(' ');
  } else if (process.platform === 'linux') {
    const linuxBuildNumber = child_process.execSync('cat /opt/android-studio/build.txt').toString();
    const linuxVersion = child_process
      .execSync('cat /opt/android-studio/bin/studio.sh | grep "$Home/.AndroidStudio" | head -1')
      .toString()
      .match(/\d\.\d/)[0];
    androidStudioVersion = `${linuxVersion} ${linuxBuildNumber}`;
  } else if (process.platform.startsWith('win')) {
    const windowsVersion = child_process
      .execSync(
        'wmic datafile where name="C:\\\\Program Files\\\\Android\\\\Android Studio\\\\bin\\\\studio.exe" get Version',
      )
      .toString()
      .replace(/(\r\n|\n|\r)/gm, '');
    const windowsBuildNumber = child_process
      .execSync(`type "C:\\\\Program File\\\\Android\\\\Android Studio\\\\build.txt"`)
      .toString()
      .replace(/(\r\n|\n|\r)/gm, '');
    androidStudioVersion = `${windowsVersion} ${windowsBuildNumber}`;
  }

  console.log(chalk.bold('Versions:'));
  console.log('  React Native: ', chalk.gray(pkg.version));
  console.log('  OS: ', chalk.gray(osName(os.platform(), os.release())));
  console.log('  Node: ', chalk.gray(process.version));
  console.log('  Yarn: ', chalk.gray(yarn.getYarnVersionIfAvailable()));
  console.log('  npm: ', chalk.gray(npmVersion));
  console.log('  Xcode: ', process.platform === 'darwin' ? chalk.gray(xcodebuildVersion) : 'N/A');
  console.log('  Android Studio: ', chalk.gray(androidStudioVersion));
};

module.exports = {
  name: 'info',
  description: 'Get relevant version info about OS, toolchain and libraries',
  func: info,
};
