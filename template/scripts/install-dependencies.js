/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {execSync, spawn, spawnSync} = require('child_process');

const [, , PATH_TO_REACT_NATIVE_ROOT, PATH_TO_TEMPLATE] = process.argv;

if (!PATH_TO_REACT_NATIVE_ROOT) {
  throw new Error(
    'PATH_TO_REACT_NATIVE_ROOT is not specified. It should be the first argument from cli call',
  );
}

if (!PATH_TO_TEMPLATE) {
  throw new Error(
    'PATH_TO_TEMPLATE is not specified. It should be the second argument from cli call',
  );
}

function install() {
  const verdaccioProcess = spawn(
    'npx',
    ['verdaccio@5.15.3', '--config', 'configs/verdaccio.yml'],
    {detached: true, stdio: 'ignore'},
  );
  process.stdout.write('Bootstrapped Verdaccio \u2705\n');

  const VERDACCIO_PID = verdaccioProcess.pid;

  execSync('npm set registry http://localhost:4873');
  execSync(
    `echo "//localhost:4873/:_authToken=secretToken" > ${PATH_TO_REACT_NATIVE_ROOT}/.npmrc`,
  );

  execSync('npm publish --registry http://localhost:4873 --access public', {
    cwd: `${PATH_TO_REACT_NATIVE_ROOT}/packages/eslint-config-react-native-community`,
    stdio: [process.stdin, process.stdout, process.stderr],
  });
  process.stdout.write(
    'Published @react-native/eslint-config to proxy \u2705\n',
  );

  execSync('npm publish --registry http://localhost:4873 --access public', {
    cwd: `${PATH_TO_REACT_NATIVE_ROOT}/packages/react-native-codegen`,
    stdio: [process.stdin, process.stdout, process.stderr],
  });
  process.stdout.write('Published @react-native/codegen to proxy \u2705\n');

  spawnSync('yarn', ['install'], {
    cwd: PATH_TO_TEMPLATE,
    stdio: [process.stdin, process.stdout, process.stderr],
  });
  process.stdout.write('Installed dependencies via Yarn \u2705\n');

  process.stdout.write(`Killing verdaccio. PID — ${VERDACCIO_PID}...\n`);
  execSync(`kill -9 ${VERDACCIO_PID}`);
  process.stdout.write('Killed Verdaccio process \u2705\n');

  process.exit();
}

install();
