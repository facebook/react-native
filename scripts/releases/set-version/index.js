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

const forEachPackage = require('../../monorepo/for-each-package');
const {updateGradleFile, updateSourceFiles} = require('../set-rn-version');
const {parseVersion} = require('../utils/version-utils');
const {promises: fs, readFileSync} = require('fs');
const path = require('path');
const yargs = require('yargs');

function getPublicPackages() {
  // eslint-disable-next-line func-call-spacing
  const packages = new Set /*::<string>*/();
  forEachPackage(
    (_, __, packageJson) => {
      if (packageJson.private !== true) {
        packages.add(packageJson.name);
      }
    },
    {includeReactNative: true},
  );
  return packages;
}

function updatePackages(
  version /*: string */,
  skipReactNativeVersion /*: ?boolean */,
) {
  const publicPackages = getPublicPackages();
  const writes = [];

  forEachPackage(
    (packageAbsolutePath, _, packageJson) => {
      if (packageJson.private === true) {
        return;
      }

      if (
        packageJson.name === 'react-native' &&
        skipReactNativeVersion === true
      ) {
        // Don't set react-native's version if skipReactNativeVersion
        // but still update its dependencies
      } else {
        packageJson.version = version;
      }

      if (packageJson.dependencies != null) {
        for (const dependency of Object.keys(packageJson.dependencies)) {
          if (publicPackages.has(dependency)) {
            packageJson.dependencies[dependency] = version;
          }
        }
      }

      if (packageJson.devDependencies != null) {
        for (const devDependency of Object.keys(packageJson.devDependencies)) {
          if (publicPackages.has(devDependency)) {
            packageJson.devDependencies[devDependency] = version;
          }
        }
      }

      writes.push(
        fs.writeFile(
          path.join(packageAbsolutePath, 'package.json'),
          JSON.stringify(packageJson, null, 2) + '\n',
          'utf-8',
        ),
      );

      // Update template package.json
      if (packageJson.name === 'react-native') {
        const templatePackageJsonPath = path.join(
          packageAbsolutePath,
          'template',
          'package.json',
        );
        const templatePackageJson = JSON.parse(
          readFileSync(templatePackageJsonPath).toString(),
        );
        if (templatePackageJson.dependencies != null) {
          for (const dependency of Object.keys(
            templatePackageJson.dependencies,
          )) {
            if (
              dependency === 'react-native' &&
              skipReactNativeVersion === true
            ) {
              // Skip updating react-native version in template package.json
              continue;
            }

            if (publicPackages.has(dependency)) {
              templatePackageJson.dependencies[dependency] = version;
            }
          }
        }

        if (templatePackageJson.devDependencies != null) {
          for (const devDependency of Object.keys(
            templatePackageJson.devDependencies,
          )) {
            if (publicPackages.has(devDependency)) {
              templatePackageJson.devDependencies[devDependency] = version;
            }
          }
        }
        writes.push(
          fs.writeFile(
            templatePackageJsonPath,
            JSON.stringify(templatePackageJson, null, 2) + '\n',
            'utf-8',
          ),
        );
      }
    },
    {includeReactNative: true},
  );

  return Promise.all(writes);
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
  skipReactNativeVersion /*: ?boolean */,
) {
  const parsedVersion = parseVersion(version);

  if (skipReactNativeVersion !== true) {
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
