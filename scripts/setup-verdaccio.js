/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {exec} = require('shelljs');
const spawn = require('child_process').spawn;

function setupVerdaccio() {
  const verdaccioProcess = spawn('npx', [
    'verdaccio@5.15.3',
    '--config',
    '.circleci/verdaccio.yml',
  ]);
  const VERDACCIO_PID = verdaccioProcess.pid;
  exec('npx wait-on@6.0.1 http://localhost:4873');
  exec('npm set registry http://localhost:4873');
  exec('echo "//localhost:4873/:_authToken=secretToken" > .npmrc');
  return VERDACCIO_PID;
}

module.exports = {
  setupVerdaccio: setupVerdaccio,
};
