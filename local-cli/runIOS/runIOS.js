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
const fs = require('fs');
const path = require('path');
const parseCommandLine = require('../util/parseCommandLine');
const findXcodeProject = require('./findXcodeProject');
const Promise = require('promise');

/**
 * Starts the app on iOS simulator
 */
function runIOS(argv, config) {
  return new Promise((resolve, reject) => {
    _runIOS(argv, config, resolve, reject);
  });
}

function _runIOS(argv, config, resolve, reject) {
  const args = parseCommandLine([{
    command: 'simulator',
    type: 'string',
    required: false,
  }], argv);

  process.chdir('ios');
  const xcodeProject = findXcodeProject(fs.readdirSync('.'));
  if (!xcodeProject) {
    console.warn(chalk.red('Could not find Xcode project files in ios folder'));
    reject();
    return;
  }

  console.log(xcodeProject);
  return resolve();
}

module.exports = runIOS;
