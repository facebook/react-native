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

function updatePackages(version /*: string */) {
  const publicPackages = getPublicPackages();
  const writes = [];

  forEachPackage(
    (packageAbsolutePath, _, packageJson) => {
      if (packageJson.private === true) {
        return;
      }

      packageJson.version = version;

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

async function setVersion(version /*: string */) {
  const parsedVersion = parseVersion(version);

  await updateSourceFiles(parsedVersion);
  await updateGradleFile(parsedVersion.version);
  await updatePackages(parsedVersion.version);
}

/*
 Sets a singular version for the entire monorepo (including `react-native` package)
 * Update all public npm packages under `<root>/packages` to specified version
 * Update all npm dependencies of a `<root>/packages` package to specified version
 * Update npm dependencies of the template app (`packages/react-native/template`) to specified version
 * Update `packages/react-native` native source and build files to specified version
 */

if (require.main === module) {
  const {toVersion} = yargs(process.argv.slice(2))
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
    .parseSync();
  setVersion(toVersion).then(
    () => process.exit(0),
    error => {
      console.error(`Failed to set version ${toVersion}\n`, error);
      process.exit(1);
    },
  );
}

module.exports = setVersion;
