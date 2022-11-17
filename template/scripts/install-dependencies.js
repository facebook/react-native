/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {exec, spawn} = require('child_process');

const {REPO_ROOT} = process.env;

function install() {
  const verdaccioProcess = spawn('npx', [
    'verdaccio@5.15.3',
    '--config',
    'configs/verdaccio.yml',
  ]);
  exec('echo "Bootstrapped Verdaccio \u2705"');

  const VERDACCIO_PID = verdaccioProcess.pid;

  exec('npx wait-on@6.0.1 http://localhost:4873');

  exec('npm set registry http://localhost:4873');
  exec('echo "//localhost:4873/:_authToken=secretToken" > .npmrc');

  exec(`cd ${REPO_ROOT}/packages/eslint-config-react-native-community`);
  exec('npm publish --registry http://localhost:4873 --access public');
  exec('echo "Published @react-native/eslint-config to proxy \u2705"');

  exec('yarn');
  exec('echo "Installed dependencies via Yarn \u2705"');

  exec(`echo "Killing verdaccio. PID — ${VERDACCIO_PID}"`);
  exec(`kill -9 ${VERDACCIO_PID}`);
  exec('echo "Killed Verdaccio process \u2705"');

  process.exit();
}

install();
