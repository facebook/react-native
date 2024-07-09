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

/*:: import type {ProjectInfo} from '../utils/monorepo'; */

const {retry} = require('../circleci/retry');
const {REPO_ROOT} = require('../consts');
const {getPackages} = require('../utils/monorepo');
const {
  VERDACCIO_SERVER_URL,
  VERDACCIO_STORAGE_PATH,
  setupVerdaccio,
} = require('./utils/verdaccio');
const {parseArgs} = require('@pkgjs/parseargs');
const chalk = require('chalk');
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const config = {
  options: {
    projectName: {type: 'string'},
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
    --projectName             The name of the new React Native project.
    --directory               The absolute path to the target project directory.
    --pathToLocalReactNative  The absolute path to the local react-native package.
    --verbose                 Print additional output. Default: false.
    `);
    return;
  }

  await initNewProjectFromSource(options);

  // TODO(T179377112): Fix memory leak from `spawn` in `setupVerdaccio` (above
  // kill command does not wait for kill success).
  process.exit(0);
}

async function initNewProjectFromSource(
  {
    projectName,
    directory,
    pathToLocalReactNative = null,
    verbose = false,
  } /*: {projectName: string, directory: string, pathToLocalReactNative?: ?string, verbose?: boolean} */,
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
    const packages = await getPackages({
      includeReactNative: false,
      includePrivate: false,
    });

    for (const {path: packagePath, packageJson} of Object.values(packages)) {
      const desc = `${packageJson.name} (${path.relative(
        REPO_ROOT,
        packagePath,
      )})`;
      process.stdout.write(
        `${desc} ${chalk.dim('.').repeat(Math.max(0, 72 - desc.length))} `,
      );
      execSync(
        `npm publish --registry ${VERDACCIO_SERVER_URL} --access public`,
        {
          cwd: packagePath,
          stdio: verbose ? 'inherit' : [process.stderr],
        },
      );
      process.stdout.write(chalk.reset.inverse.bold.green(' DONE ') + '\n');
    }
    console.log('\nDone ✅');

    console.log('Running react-native init without install');
    execSync(
      `npx @react-native-community/cli@next init ${projectName} \
        --directory ${directory} \
        --version 0.75.0-rc.2 \
        --verbose \
        --pm npm \
        --skip-install`,
      {
        // Avoid loading packages/react-native/react-native.config.js
        cwd: REPO_ROOT,
        stdio: 'inherit',
      },
    );
    console.log('\nDone ✅');

    _updateScopedPackages(packages, directory);
    _updateReactNativeInTemplateIfNeeded(pathToLocalReactNative, directory);

    console.log('Installing project dependencies');
    await installProjectUsingProxy(directory);
    console.log('Done ✅');
  } catch (e) {
    console.log('Failed ❌');
    throw e;
  } finally {
    console.log(`Cleanup: Killing Verdaccio process (PID: ${verdaccioPid})`);
    try {
      execSync(`kill -9 ${verdaccioPid}`);
      console.log('Done ✅');
    } catch {
      console.warn('Failed to kill Verdaccio process');
    }
    console.log('Cleanup: Removing Verdaccio storage directory');
    execSync(`rm -rf ${VERDACCIO_STORAGE_PATH}`);
    console.log('Done ✅');
  }
}

async function installProjectUsingProxy(cwd /*: string */) {
  const execOptions = {
    cwd,
    stdio: 'inherit',
  };

  // TODO(huntie): Review pre-existing retry limit
  const success = await retry('npm', execOptions, 3, 500, [
    'install',
    '--registry',
    VERDACCIO_SERVER_URL,
  ]);

  if (!success) {
    throw new Error('Failed to install project dependencies');
  }
}

function _updateScopedPackages(
  packages /*: ProjectInfo */,
  directory /*: string */,
) {
  console.log(
    'Updating the scoped packagesto match the version published in Verdaccio',
  );

  // Packages are updated in a lockstep and all with the same version.
  // Pick the version from the first package
  const version = packages[Object.keys(packages)[0]].packageJson.version;

  // Update scoped packages which starts with @react-native
  const appPackageJsonPath = path.join(directory, 'package.json');
  const appPackageJson = JSON.parse(
    fs.readFileSync(appPackageJsonPath, 'utf8'),
  );

  for (const [key, _] of Object.entries(appPackageJson.dependencies)) {
    if (key.startsWith('@react-native')) {
      appPackageJson.dependencies[key] = version;
    }
  }
  for (const [key, _] of Object.entries(appPackageJson.devDependencies)) {
    if (key.startsWith('@react-native')) {
      appPackageJson.devDependencies[key] = version;
    }
  }

  fs.writeFileSync(appPackageJsonPath, JSON.stringify(appPackageJson, null, 2));

  console.log('Done ✅');
}

function _updateReactNativeInTemplateIfNeeded(
  pathToLocalReactNative /*: ?string */,
  directory /*: string */,
) {
  if (pathToLocalReactNative != null) {
    console.log('Updating the template version to local react-native');
    // Update template version.
    const appPackageJsonPath = path.join(directory, 'package.json');
    const appPackageJson = JSON.parse(
      fs.readFileSync(appPackageJsonPath, 'utf8'),
    );
    appPackageJson.dependencies['react-native'] =
      `file:${pathToLocalReactNative}`;
    fs.writeFileSync(
      appPackageJsonPath,
      JSON.stringify(appPackageJson, null, 2),
    );
    console.log('Done ✅');
  }
}

module.exports = {
  initNewProjectFromSource,
};

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
