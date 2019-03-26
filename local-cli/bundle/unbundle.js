/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const bundleCommandLineArgs = require('./bundleCommandLineArgs');

module.exports = {
  name: 'unbundle',
  description: 'Deprecated. Renamed to `ram-bundle`.',
  func: () => {
    throw new Error(
      'The `unbundle` command has been renamed `ram-bundle` to better ' +
        'represent the actual functionality. `ram` mean "Random Access ' +
        'Module", this particular format of bundle. Functionality remained ' +
        'unchanged.',
    );
  },
  options: bundleCommandLineArgs.concat({
    command: '--indexed-unbundle',
    description: 'Deprecated. Renamed to `--indexed-ram-bundle`.',
    default: false,
  }),
};
