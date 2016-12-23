#!/usr/bin/env node

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

var argv = require('minimist')(process.argv.slice(2));
var cli = require('./cli');

if (argv._.length === 0 && (argv.h || argv.help)) {
  console.log([
    '',
    '  Usage: react-native-git-upgrade [version] [options]',
    '',
    '',
    '  Commands:',
    '',
    '    [Version]     upgrades React Native and app templates to the desired version',
    '                  (latest, if not specified)',
    '',
    '  Options:',
    '',
    '    -h, --help    output usage information',
    '    -v, --version output the version number',
    '    --verbose output debugging info',
    '    --npm force using the npm client even if your project uses yarn',
    '',
  ].join('\n'));
  process.exit(0);
}

if (argv._.length === 0 && (argv.v || argv.version)) {
  console.log(require('./package.json').version);
  process.exit(0);
}

cli.run(argv._[0], argv)
  .catch(console.error);
