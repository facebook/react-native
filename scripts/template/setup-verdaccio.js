/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use strict';

const {execSync, spawn} = require('child_process');

function setupVerdaccio(
  reactNativeRootPath /*: string */,
  verdaccioConfigPath /*: string */,
  verdaccioStoragePath /*: ?string */,
) /*: number */ {
  execSync('echo "//localhost:4873/:_authToken=secretToken" > .npmrc', {
    cwd: reactNativeRootPath,
  });

  const verdaccioProcess = spawn(
    'npx',
    ['verdaccio@5.16.3', '--config', verdaccioConfigPath],
    {env: {...process.env, VERDACCIO_STORAGE_PATH: verdaccioStoragePath}},
  );

  execSync('npx wait-on@6.0.1 http://localhost:4873');
  execSync('npm set registry http://localhost:4873');

  return verdaccioProcess.pid;
}

module.exports = setupVerdaccio;
