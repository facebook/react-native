/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {spawnSync} = require('child_process');
const {writeFileSync, readFileSync} = require('fs');
const path = require('path');

const checkForGitChanges = require('./check-for-git-changes');
const forEachPackage = require('./for-each-package');

const ROOT_LOCATION = path.join(__dirname, '..', '..');
const TEMPLATE_LOCATION = path.join(ROOT_LOCATION, 'template');
const REPO_CONFIG_LOCATION = path.join(ROOT_LOCATION, 'repo-config');

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
  if (checkForGitChanges()) {
    console.log(
      '\u274c Found uncommitted changes. Please commit or stash them before running this script',
    );

    process.exit(1);
  }

  forEachPackage((packageAbsolutePath, _, packageManifest) => {
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

    checkIfShouldUpdateDependencyPackageVersion(
      REPO_CONFIG_LOCATION,
      packageManifest.name,
      packageManifest.version,
    );

    forEachPackage(pathToPackage =>
      checkIfShouldUpdateDependencyPackageVersion(
        pathToPackage,
        packageManifest.name,
        packageManifest.version,
      ),
    );
  });

  if (!checkForGitChanges()) {
    console.log(
      '\u2705 There were no changes. Every consumer package uses the actual version of dependency package.',
    );
    return;
  }

  console.log('Running yarn to update lock file...');
  spawnSync('yarn', ['install'], {
    cwd: ROOT_LOCATION,
    shell: true,
    stdio: 'inherit',
    encoding: 'utf-8',
  });
};

alignPackageVersions();
