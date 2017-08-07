/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const opn = require('opn');
const execSync = require('child_process').execSync;

function commandExistsUnixSync (commandName, callback) {
  try {
    var stdout = execSync('command -v ' + commandName +
          ' 2>/dev/null' +
          ' && { echo >&1 \'' + commandName + ' found\'; exit 0; }');
    return !!stdout;
  } catch (error) {
    return false;
  }
}

function getChromeAppName(): string {
  switch (process.platform) {
  case 'darwin':
    return 'google chrome';
  case 'win32':
    return 'chrome';
  case 'linux':
    if (commandExistsUnixSync('google-chrome')) {
      return 'google-chrome';
    } else {
      return 'chromium';
    }
  default:
    return 'google-chrome';
  }
}

function launchChrome(url: string) {
  opn(url, {app: [getChromeAppName()]}, function(err) {
    if (err) {
      console.error('Google Chrome exited with error:', err);
    }
  });
}

module.exports = launchChrome;
