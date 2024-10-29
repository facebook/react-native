/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

if (require.main === module) {
  require('../../../../scripts/build/babel-register').registerForMonorepo();

  let command;

  if (process.argv.includes('--update')) {
    command = 'update';
  } else if (process.argv.includes('--verify-unchanged')) {
    command = 'verify-unchanged';
  }

  switch (command) {
    case 'update':
      require('./update').default(false);
      break;
    case 'verify-unchanged':
      require('./update').default(true);
      break;
    default:
      console.error(
        'Usage: node featureflags.js [--update|--verify-unchanged]',
      );
      process.exit(1);
  }
}
