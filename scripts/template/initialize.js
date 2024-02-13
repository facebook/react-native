/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

'use strict';

const {retry} = require('../circleci/retry');
const forEachPackage = require('../monorepo/for-each-package');
const setupVerdaccio = require('./setup-verdaccio');
const {parseArgs} = require('@pkgjs/parseargs');
const {execSync} = require('child_process');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');
const VERDACCIO_CONFIG_PATH = `${REPO_ROOT}/.circleci/verdaccio.yml`;
const NPM_REGISTRY_SERVER = 'http://localhost:4873';

const config = {
  options: {
    projectName: {type: 'string'},
    templatePath: {type: 'string'},
    directory: {type: 'string'},
    help: {type: 'boolean'},
  },
};

async function main() {
  const {
    values: {help, projectName, templatePath, directory},
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/template/initialize.js [OPTIONS]

  Bootstraps and runs \`react-native init\`, using the currently checked out
  repository as the source of truth for the react-native package and
  dependencies.

  - Configures and starts a local npm proxy (Verdaccio).
  - Builds and publishes all in-repo dependencies to the local npm proxy.
  - Runs \`react-native init\` with the local npm proxy configured.
  - Does NOT install CocoaPods dependencies.

  Note: This script will mutate the contents of some package files, which
  should not be committed.

  Options:
    --projectName      The name of the new React Native project.
    --templatePath     The absolute path to the folder containing the template.
    --directory        The absolute path to the target project directory.
    `);
    return;
  }

  const VERDACCIO_PID = setupVerdaccio(REPO_ROOT, VERDACCIO_CONFIG_PATH);

  try {
    process.stdout.write('Bootstrapped Verdaccio \u2705\n');

    process.stdout.write('Building packages...\n');
    execSync('node ./scripts/build/build.js', {
      cwd: REPO_ROOT,
      stdio: [process.stdin, process.stdout, process.stderr],
    });

    process.stdout.write('Starting to publish every package...\n');
    forEachPackage(
      (packageAbsolutePath, packageRelativePathFromRoot, packageManifest) => {
        if (packageManifest.private) {
          return;
        }

        execSync(
          `npm publish --registry ${NPM_REGISTRY_SERVER} --access public`,
          {
            cwd: packageAbsolutePath,
            stdio: [process.stdin, process.stdout, process.stderr],
          },
        );

        process.stdout.write(
          `Published ${packageManifest.name} to proxy \u2705\n`,
        );
      },
    );

    process.stdout.write('Published every package \u2705\n');

    execSync(
      `node cli.js init ${projectName} \
        --directory ${directory} \
        --template ${templatePath} \
        --verbose \
        --skip-install \
        --yarn-config-options npmRegistryServer="${NPM_REGISTRY_SERVER}"`,
      {
        cwd: `${REPO_ROOT}/packages/react-native`,
        stdio: [process.stdin, process.stdout, process.stderr],
      },
    );
    process.stdout.write('Completed initialization of template app \u2705\n');

    process.stdout.write('Installing dependencies in template app folder...\n');
    const options = {
      cwd: directory,
      stdio: [process.stdin, process.stdout, process.stderr],
    };

    execSync(
      `yarn config set npmRegistryServer "${NPM_REGISTRY_SERVER}"`,
      options,
    );

    execSync(
      'yarn config set unsafeHttpWhitelist --json \'["localhost"]\'',
      options,
    );

    const success = await retry('yarn', options, 3, 500, ['install']);

    if (!success) {
      process.stdout.write(
        'Failed to install dependencies in template app folder.',
      );
      throw new Error('Failed to install dependencies in template app folder.');
    }

    process.stdout.write('Installed dependencies via Yarn \u2705\n');
  } finally {
    process.stdout.write(`Killing verdaccio. PID — ${VERDACCIO_PID}...\n`);
    execSync(`kill -9 ${VERDACCIO_PID}`);
    process.stdout.write('Killed Verdaccio process \u2705\n');
    // TODO(huntie): Fix memory leak from `spawn` in `setupVerdaccio` (above
    // kill command does not wait for kill success).
    process.exit(0);
  }
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
