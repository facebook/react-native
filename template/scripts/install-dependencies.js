/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

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

const {execSync, spawnSync} = require('child_process');
const setupVerdaccio = require(`${PATH_TO_REACT_NATIVE_ROOT}/scripts/setup-verdaccio`);

const VERDACCIO_CONFIG_PATH = `${PATH_TO_TEMPLATE}/configs/verdaccio.yml`;

function install() {
  const VERDACCIO_PID = setupVerdaccio(
    PATH_TO_REACT_NATIVE_ROOT,
    VERDACCIO_CONFIG_PATH,
  );
  process.stdout.write('Bootstrapped Verdaccio \u2705\n');

  execSync('npm publish --registry http://localhost:4873 --access public', {
    cwd: `${PATH_TO_REACT_NATIVE_ROOT}/packages/eslint-plugin-react-native-community`,
    stdio: [process.stdin, process.stdout, process.stderr],
  });
  process.stdout.write(
    'Published @react-native/eslint-plugin to proxy \u2705\n',
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
