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
var semver = require('semver');

var formatBanner = require('./formatBanner');

function checkNodeVersion() {
  if (!semver.satisfies(process.version, '>=2.0.0')) {
    var engine = semver.lt(process.version, '1.0.0') ? 'Node' : 'io.js';
    var message = 'You are currently running ' + engine + ' ' +
      process.version + '.\n' +
      '\n' +
      'React Native is moving to io.js 2.x. There are several ways to upgrade' +
      'to io.js depending on your preference.\n' +
      '\n' +
      'nvm:       nvm install iojs && nvm alias default iojs\n' +
      'Homebrew:  brew unlink node; brew install iojs && brew ln iojs --force\n' +
      'Installer: download the Mac .pkg from https://iojs.org/\n' +
      '\n' +
      'About io.js:     https://iojs.org\n' +
      'Follow along at: https://github.com/facebook/react-native/issues/1737';
    console.log(formatBanner(message, {
      chalkFunction: chalk.green,
      marginLeft: 1,
      marginRight: 1,
      paddingBottom: 1,
    }));
  }
}

module.exports = checkNodeVersion;
