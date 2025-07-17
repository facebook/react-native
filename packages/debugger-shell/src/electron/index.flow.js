/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// $FlowFixMe[unclear-type] We have no Flow types for the Electron API.
const {app} = require('electron') as any;
const util = require('util');

// Handle global command line arguments which don't require a window
// or the single instance lock to be held.
const {
  values: {version = false},
} = util.parseArgs({
  options: {version: {type: 'boolean'}},
  args: process.argv.slice(app.isPackaged ? 1 : 2),
  strict: false,
});
if (version) {
  console.log(`${app.getName()} v${app.getVersion()}`);
  // Not app.quit() - we want to exit immediately without initialising the graphical subsystem.
  app.exit(0);
}

const gotTheLock = app.requestSingleInstanceLock({
  argv: process.argv.slice(2),
});

if (!gotTheLock) {
  app.quit();
} else {
  require('./MainInstanceEntryPoint.js');
}
