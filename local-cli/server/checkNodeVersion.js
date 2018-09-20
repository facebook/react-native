/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Be mindful that this script may be run by legacy NodeJS runtimes. Keep this
 * script ES5 compatible (e.g. do not insert the `@format` pragma here which
 * may introduce non-ES5 compatible syntax.)
 *
 */

'use strict';

var chalk = require('chalk');
var formatBanner = require('metro-core/src/formatBanner');
var semver = require('semver');

module.exports = function() {
  if (!semver.satisfies(process.version, '>=8.3')) {
    var engine = semver.satisfies(process.version, '<1') ? 'Node' : 'io.js';

    var message =
      'You are currently running ' +
      engine +
      ' ' +
      process.version +
      '.\n' +
      '\n' +
      'React Native runs on Node 8.3 or newer. There are several ways to ' +
      'upgrade Node.js depending on your preference.\n' +
      '\n' +
      'nvm:       nvm install 8.3 --reinstall-packages-from=node\n' +
      'Homebrew:  brew update && brew upgrade node\n' +
      'Installer: download from https://nodejs.org/\n';
    console.log(
      formatBanner(message, {
        chalkFunction: chalk.green,
        marginLeft: 1,
        marginRight: 1,
        paddingBottom: 1,
      })
    );
    process.exit(1);
  }
};
