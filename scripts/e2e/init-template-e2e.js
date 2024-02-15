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
const {
  VERDACCIO_SERVER_URL,
  VERDACCIO_STORAGE_PATH,
  setupVerdaccio,
} = require('./utils/verdaccio');
const {parseArgs} = require('@pkgjs/parseargs');
const chalk = require('chalk');
const {execSync} = require('child_process');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');

const config = {
  options: {
    projectName: {type: 'string'},
    templatePath: {type: 'string'},
    directory: {type: 'string'},
    verbose: {type: 'boolean', default: false},
    help: {type: 'boolean'},
  },
};

async function main() {
  const {
    values: {help, ...options},
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/e2e/init-template-e2e.js [OPTIONS]

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
    --verbose          Print additional output. Default: false.
    `);
    return;
  }

  await initNewProjectFromSource(options);
}

async function initNewProjectFromSource(
  {
    projectName,
    templatePath,
    directory,
    verbose = false,
  } /*: {projectName: string, templatePath: string, directory: string, verbose?: boolean} */,
) {
  console.log('Starting local npm proxy (Verdaccio)');
  const verdaccioPid = setupVerdaccio();
  console.log('Done ✅');

  try {
    execSync('node ./scripts/build/build.js', {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });
    console.log('\nDone ✅');

    console.log('Publishing packages to local npm proxy\n');
    forEachPackage(
      (packageAbsolutePath, packageRelativePathFromRoot, packageManifest) => {
        if (packageManifest.private) {
          return;
        }

        const desc = `${packageManifest.name} (${packageRelativePathFromRoot})`;
        process.stdout.write(
          `${desc} ${chalk.dim('.').repeat(Math.max(0, 72 - desc.length))} `,
        );
        execSync(
          `npm publish --registry ${VERDACCIO_SERVER_URL} --access public`,
          {
            cwd: packageAbsolutePath,
            stdio: verbose ? 'inherit' : [process.stderr],
          },
        );
        process.stdout.write(chalk.reset.inverse.bold.green(' DONE ') + '\n');
      },
    );
    console.log('\nDone ✅');

    console.log('Running react-native init without install');
    execSync(
      `node ./packages/react-native/cli.js init ${projectName} \
        --directory ${directory} \
        --template ${templatePath} \
        --verbose \
        --skip-install \
        --yarn-config-options npmRegistryServer="${VERDACCIO_SERVER_URL}"`,
      {
        // Avoid loading packages/react-native/react-native.config.js
        cwd: REPO_ROOT,
        stdio: verbose ? 'inherit' : [process.stderr],
      },
    );
    console.log('\nDone ✅');

    console.log('Installing project dependencies');
    await runYarnUsingProxy(directory);
    console.log('Done ✅');
  } catch (e) {
    console.log('Failed ❌');
    throw e;
  } finally {
    console.log(`Cleanup: Killing Verdaccio process (PID: ${verdaccioPid})`);
    execSync(`kill -9 ${verdaccioPid}`);
    console.log('Done ✅');

    console.log('Cleanup: Removing Verdaccio storage directory');
    execSync(`rm -rf ${VERDACCIO_STORAGE_PATH}`);
    console.log('Done ✅');

    // TODO(huntie): Fix memory leak from `spawn` in `setupVerdaccio` (above
    // kill command does not wait for kill success).
    process.exit(0);
  }
}

async function runYarnUsingProxy(cwd /*: string */) {
  const execOptions = {
    cwd,
    stdio: 'inherit',
  };
  execSync(
    `yarn config set npmRegistryServer "${VERDACCIO_SERVER_URL}"`,
    execOptions,
  );
  execSync(
    'yarn config set unsafeHttpWhitelist --json \'["localhost"]\'',
    execOptions,
  );

  // TODO(huntie): Review pre-existing retry limit
  const success = await retry('yarn', execOptions, 3, 500, ['install']);

  if (!success) {
    throw new Error('Failed to install project dependencies');
  }
}

module.exports = {
  initNewProjectFromSource,
};

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
