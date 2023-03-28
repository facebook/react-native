/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {writeFileSync, readFileSync} = require('fs');
const path = require('path');

const forEachPackage = require('./for-each-package');

const ROOT_LOCATION = path.join(__dirname, '..', '..');
const TEMPLATE_LOCATION = path.join(
  ROOT_LOCATION,
  'packages',
  'react-native',
  'template',
);

const readJSONFile = pathToFile => JSON.parse(readFileSync(pathToFile));

const checkIfShouldUpdateDependencyPackageVersion = (
  consumerPackageAbsolutePath,
  updatedPackageName,
  updatedPackageVersion,
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

const alignPackageVersions = () => {
  forEachPackage((_, __, packageManifest) => {
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

    forEachPackage(
      pathToPackage =>
        checkIfShouldUpdateDependencyPackageVersion(
          pathToPackage,
          packageManifest.name,
          packageManifest.version,
        ),
      {includeReactNative: true},
    );
  });
};

module.exports = alignPackageVersions;
