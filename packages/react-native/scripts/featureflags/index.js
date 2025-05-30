/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

if (require.main === module) {
  require('../../../../scripts/babel-register').registerForMonorepo();

  let command;

  if (process.argv.includes('--update')) {
    command = 'update';
  } else if (process.argv.includes('--verify-unchanged')) {
    command = 'verify-unchanged';
  } else if (process.argv.includes('--print')) {
    command = 'print';
  } else if (process.argv.includes('--help')) {
    command = 'help';
  } else {
    console.log('Defaulting to `--update`. See all options using `--help`.');
    command = 'update';
  }

  switch (command) {
    case 'update':
      require('./update').default(false);
      break;
    case 'verify-unchanged':
      require('./update').default(true);
      break;
    case 'print':
      require('./print').default(process.argv.includes('--json'));
      break;
    case 'help':
      console.log(
        'Usage: node featureflags.js [--update|--verify-unchanged|--print|--help]',
      );
      break;
    default:
      throw new Error('Unexpected script execution.');
  }
}
