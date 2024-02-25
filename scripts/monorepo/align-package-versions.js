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

/*::
import type {PackageJson} from '../utils/monorepo';
*/

const {getPackages} = require('../utils/monorepo');
const {readFileSync, writeFileSync} = require('fs');
const path = require('path');

const ROOT_LOCATION = path.join(__dirname, '..', '..');
const TEMPLATE_LOCATION = path.join(
  ROOT_LOCATION,
  'packages',
  'react-native',
  'template',
);

const readJSONFile = (pathToFile /*: string */) /*: PackageJson */ =>
  JSON.parse(readFileSync(pathToFile, 'utf-8'));

const checkIfShouldUpdateDependencyPackageVersion = (
  consumerPackageAbsolutePath /*: string */,
  updatedPackageName /*: string */,
  updatedPackageVersion /*: string */,
) => {
  const consumerPackageManifestPath = path.join(
    consumerPackageAbsolutePath,
    'package.json',
  );
  const consumerPackageManifest = readJSONFile(consumerPackageManifestPath);

  const dependencyVersion =
    consumerPackageManifest.dependencies?.[updatedPackageName];

  if (dependencyVersion && dependencyVersion !== '*') {
    const updatedDependencyVersion = dependencyVersion.startsWith('^')
      ? `^${updatedPackageVersion}`
      : updatedPackageVersion;

    if (updatedDependencyVersion !== dependencyVersion) {
      console.log(
        `\uD83D\uDCA1 ${consumerPackageManifest.name} was updated: now using version ${updatedPackageVersion} of ${updatedPackageName}`,
      );

      const updatedPackageManifest = {
        ...consumerPackageManifest,
        dependencies: {
          ...consumerPackageManifest.dependencies,
          [updatedPackageName]: updatedDependencyVersion,
        },
      };

      writeFileSync(
        consumerPackageManifestPath,
        JSON.stringify(updatedPackageManifest, null, 2) + '\n',
        'utf-8',
      );
    }
  }

  const devDependencyVersion =
    consumerPackageManifest.devDependencies?.[updatedPackageName];

  if (devDependencyVersion && devDependencyVersion !== '*') {
    const updatedDependencyVersion = devDependencyVersion.startsWith('^')
      ? `^${updatedPackageVersion}`
      : updatedPackageVersion;

    if (updatedDependencyVersion !== devDependencyVersion) {
      console.log(
        `\uD83D\uDCA1 ${consumerPackageManifest.name} was updated: now using version ${updatedPackageVersion} of ${updatedPackageName}`,
      );

      const updatedPackageManifest = {
        ...consumerPackageManifest,
        devDependencies: {
          ...consumerPackageManifest.devDependencies,
          [updatedPackageName]: updatedDependencyVersion,
        },
      };

      writeFileSync(
        consumerPackageManifestPath,
        JSON.stringify(updatedPackageManifest, null, 2) + '\n',
        'utf-8',
      );
    }
  }
};

async function alignPackageVersions() {
  const allPackages = await getPackages({
    includeReactNative: true,
    includePrivate: true,
  });
  const packagesExcludingReactNative = Object.keys(allPackages).filter(
    packageName => packageName !== 'react-native',
  );

  for (const packageName of packagesExcludingReactNative) {
    const {packageJson: packageManifest} = allPackages[packageName];

    checkIfShouldUpdateDependencyPackageVersion(
      ROOT_LOCATION,
      packageManifest.name,
      packageManifest.version,
    );

    checkIfShouldUpdateDependencyPackageVersion(
      TEMPLATE_LOCATION,
      packageManifest.name,
      packageManifest.version,
    );

    for (const {path: pathToPackage} of Object.values(allPackages)) {
      checkIfShouldUpdateDependencyPackageVersion(
        pathToPackage,
        packageManifest.name,
        packageManifest.version,
      );
    }
  }
}

module.exports = alignPackageVersions;
