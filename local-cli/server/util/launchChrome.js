/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
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
    } else if (commandExistsUnixSync('chromium-browser')) {
      return 'chromium-browser';
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
