/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const path = require('path');
const {readdirSync, readFileSync} = require('fs');

import {Dirent} from 'fs';
import {PackageManifest} from '../../types/private/PackageManifest';

const ROOT_LOCATION = path.join(__dirname, '..', '..');
const PACKAGES_LOCATION = path.join(ROOT_LOCATION, 'packages');

const PACKAGES_BLOCK_LIST = ['react-native'];

const getDirectories = (source: string): string[] =>
  readdirSync(source, {withFileTypes: true})
    .filter((file: Dirent) => file.isDirectory())
    .map((directory: Dirent) => directory.name);

type ForEachPackageCallback = (
  packageAbsolutePath: string,
  packageRelativePathFromRoot: string,
  packageManifest: PackageManifest,
) => void;

const forEachPackage = (callback: ForEachPackageCallback) => {
  // We filter react-native package on purpose, so that no CI's script will be executed for this package in future
  const packagesDirectories = getDirectories(PACKAGES_LOCATION).filter(
    directoryName => !PACKAGES_BLOCK_LIST.includes(directoryName),
  );

  packagesDirectories.forEach(packageDirectory => {
    const packageAbsolutePath = path.join(PACKAGES_LOCATION, packageDirectory);
    const packageRelativePathFromRoot = path.join('packages', packageDirectory);

    const packageManifestFileContent = readFileSync(
      path.join(packageAbsolutePath, 'package.json'),
    );
    const packageManifest = JSON.parse(packageManifestFileContent.toString());

    callback(packageAbsolutePath, packageRelativePathFromRoot, packageManifest);
  });
};

module.exports = forEachPackage;
