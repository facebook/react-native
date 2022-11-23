/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const yargs = require('yargs');
const {execSync, spawnSync} = require('child_process');
const setupVerdaccio = require('../setup-verdaccio');

const {argv} = yargs
  .option('r', {
    alias: 'reactNativeRootPath',
    describe: 'Path to root folder of react-native',
    required: true,
  })
  .option('c', {
    alias: 'templatePath',
    describe: 'Path to template application folder',
    required: true,
  })
  .strict();

const {reactNativeRootPath, templatePath} = argv;

const VERDACCIO_CONFIG_PATH = `${reactNativeRootPath}/scripts/template/verdaccio.yml`;
const VERDACCIO_STORAGE_PATH = `${templatePath}/node_modules`;

const PACKAGES_TO_PUBLISH_PATHS = [
  'packages/eslint-plugin-react-native-community',
  'packages/eslint-config-react-native-community',
];

function install() {
  const VERDACCIO_PID = setupVerdaccio(
    reactNativeRootPath,
    VERDACCIO_CONFIG_PATH,
    VERDACCIO_STORAGE_PATH,
  );
  process.stdout.write('Bootstrapped Verdaccio \u2705\n');

  // Publish all necessary packages...
  for (const packagePath of PACKAGES_TO_PUBLISH_PATHS) {
    execSync('npm publish --registry http://localhost:4873 --access public', {
      cwd: `${reactNativeRootPath}/${packagePath}`,
      stdio: [process.stdin, process.stdout, process.stderr],
    });

    process.stdout.write(`Published /${packagePath} to proxy \u2705\n`);
  }

  spawnSync('yarn', ['install'], {
    cwd: templatePath,
    stdio: [process.stdin, process.stdout, process.stderr],
  });
  process.stdout.write('Installed dependencies via Yarn \u2705\n');

  process.stdout.write(`Killing verdaccio. PID — ${VERDACCIO_PID}...\n`);
  execSync(`kill -9 ${VERDACCIO_PID}`);
  process.stdout.write('Killed Verdaccio process \u2705\n');

  process.exit();
}

install();
