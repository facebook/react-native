/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react-native
 */

'use strict';

/*::
import type {PackageJson} from '../utils/monorepo';
*/

const {REACT_NATIVE_PACKAGE_DIR} = require('../../consts');
const {updateGradleFile, updateSourceFiles} = require('../set-rn-version');
const {getPackages} = require('../utils/monorepo');
const {parseVersion} = require('../utils/version-utils');
const {promises: fs} = require('fs');
const path = require('path');
const yargs = require('yargs');

const TEMPLATE_DIR = path.join(REACT_NATIVE_PACKAGE_DIR, 'template');

async function updatePackages(
  version /*: string */,
  skipReactNativeVersion /*: boolean */,
) {
  const packages = await getPackages({
    includePrivate: false,
    includeReactNative: true,
  });
  const newPackageVersions = Object.fromEntries(
    Object.keys(packages).map(packageName => [packageName, version]),
  );
  const templatePackageJson /*: PackageJson */ = JSON.parse(
    await fs.readFile(path.join(TEMPLATE_DIR, 'package.json'), 'utf-8'),
  );
  const packagesToUpdate = [
    ...Object.values(packages),
    {
      path: TEMPLATE_DIR,
      packageJson: templatePackageJson,
    },
  ];

  await Promise.all(
    packagesToUpdate.map(({path: packagePath, packageJson}) =>
      updatePackageJson(
        packagePath,
        packageJson,
        newPackageVersions,
        skipReactNativeVersion,
      ),
    ),
  );
}

async function updatePackageJson(
  packagePath /*: string */,
  packageJson /*: PackageJson */,
  newPackageVersions /*: $ReadOnly<{[string]: string}> */,
  skipReactNativeVersion /*: boolean */,
) /*: Promise<void> */ {
  const packageName = packageJson.name;

  if (
    packageName in newPackageVersions &&
    (!skipReactNativeVersion || packageName !== 'react-native')
  ) {
    packageJson.version = newPackageVersions[packageName];
  }

  for (const dependencyField of ['dependencies', 'devDependencies']) {
    const deps = packageJson[dependencyField];

    if (deps == null) {
      continue;
    }

    for (const dependency of Object.keys(deps)) {
      if (dependency === 'react-native' && skipReactNativeVersion) {
        continue;
      }

      if (dependency in newPackageVersions) {
        deps[dependency] = newPackageVersions[dependency];
      }
    }
  }

  return fs.writeFile(
    path.join(packagePath, 'package.json'),
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf-8',
  );
}

/**
 * Sets a singular version for the entire monorepo.
 *
 * Set `skipReactNativeVersion` to true when we don't want to update the version of react-native.
 * The use-case is when we update versions on `main` after a release cut. The version of react-native
 * stays 1000.0.0.
 *
 * This script does the following:
 * - Update all public npm packages under `<root>/packages` to specified version
 * - Update all npm dependencies of a `<root>/packages` package to specified version
 * - Update npm dependencies of the template app (`packages/react-native/template`) to specified version
 * - Update `packages/react-native` native source and build files to specified version if relevant
 */
async function setVersion(
  version /*: string */,
  skipReactNativeVersion /*: boolean */ = false,
) {
  const parsedVersion = parseVersion(version);

  if (!skipReactNativeVersion) {
    await updateSourceFiles(parsedVersion);
    await updateGradleFile(parsedVersion.version);
  }

  await updatePackages(parsedVersion.version, skipReactNativeVersion);
}

if (require.main === module) {
  const {toVersion, skipReactNativeVersion} = yargs(process.argv.slice(2))
    .command(
      '$0 <to-version>',
      'Update all monorepo packages to <to-version>',
      args =>
        args.positional('to-version', {
          type: 'string',
          description: 'Sets entire monorepo to version provided',
          required: true,
        }),
    )
    .option('skip-react-native-version', {
      description: "Don't update the version of the react-native package",
      type: 'boolean',
      default: false,
    })
    .parseSync();
  setVersion(toVersion, !!skipReactNativeVersion).then(
    () => process.exit(0),
    error => {
      console.error(`Failed to set version ${toVersion}\n`, error);
      process.exit(1);
    },
  );
}

module.exports = setVersion;
