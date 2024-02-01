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
const {readFileSync, writeFileSync} = require('fs');
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

function setVersion(version /*: string */) {
  const publicPackages = getPublicPackages();

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

      writeFileSync(
        path.join(packageAbsolutePath, 'package.json'),
        JSON.stringify(packageJson, null, 2) + '\n',
        'utf-8',
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
        writeFileSync(
          templatePackageJsonPath,
          JSON.stringify(templatePackageJson, null, 2) + '\n',
          'utf-8',
        );
      }
    },
    {includeReactNative: true},
  );
}

module.exports = setVersion;

if (require.main === module) {
  const {toVersion} = yargs(process.argv.slice(2))
    .command(
      '$0 <to-version>',
      'Update all monorepo packages to <to-version>',
      args =>
        args.positional('to-version', {
          type: 'string',
          description: 'Set the version of all packages to this value',
          required: true,
        }),
    )
    .parseSync();
  setVersion(toVersion);
}
