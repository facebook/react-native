/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {execSync, spawn} = require('child_process');

function setupVerdaccio(pathToRoot, pathToConfig) {
  if (!pathToRoot) {
    throw new Error(
      'Path to React Native repo root is not specified. You should provide it as a first argument',
    );
  }

  if (!pathToConfig) {
    throw new Error(
      'Path to Verdaccio config is not specified. You should provide it as a second argument',
    );
  }

  const verdaccioProcess = spawn('npx', [
    'verdaccio@5.16.3',
    '--config',
    pathToConfig,
  ]);

  const VERDACCIO_PID = verdaccioProcess.pid;

  execSync('npx wait-on@6.0.1 http://localhost:4873');

  execSync('npm set registry http://localhost:4873');
  execSync('echo "//localhost:4873/:_authToken=secretToken" > .npmrc', {
    cwd: pathToRoot,
  });

  return VERDACCIO_PID;
}

module.exports = setupVerdaccio;
