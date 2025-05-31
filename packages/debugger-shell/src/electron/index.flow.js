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

const gotTheLock = app.requestSingleInstanceLock({
  argv: process.argv.slice(2),
});

if (!gotTheLock) {
  app.quit();
} else {
  require('./MainInstanceEntryPoint.js');
}
