/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import path from 'path';
import {writeFileSync} from 'fs';

import {PackageManifest} from '../../../types/private/PackageManifest';

type VersionIncrement = 'minor' | 'patch';

const getIncrementedVersion = (version: string, increment: VersionIncrement) =>
  version
    .split('.')
    .map((token, index) => {
      const indexOfVersionToIncrement = increment === 'minor' ? 1 : 2;

      if (index === indexOfVersionToIncrement) {
        return parseInt(token, 10) + 1;
      }

      if (index > indexOfVersionToIncrement) {
        return 0;
      }

      return token;
    })
    .join('.');

const bumpPackageVersion = (
  packageAbsolutePath: string,
  packageManifest: PackageManifest,
  increment: VersionIncrement,
): string => {
  const updatedVersion = getIncrementedVersion(
    packageManifest.version,
    increment,
  );

  // Not using simple `npm version patch` because it updates dependencies and yarn.lock file
  writeFileSync(
    path.join(packageAbsolutePath, 'package.json'),
    JSON.stringify({...packageManifest, version: updatedVersion}, null, 2) +
      '\n',
    {encoding: 'utf-8'},
  );

  return updatedVersion;
};

export const bumpPackageMinorVersion = (
  packageAbsolutePath: string,
  packageManifest: PackageManifest,
): string => bumpPackageVersion(packageAbsolutePath, packageManifest, 'minor');

export const bumpPackagePatchVersion = (
  packageAbsolutePath: string,
  packageManifest: PackageManifest,
): string => bumpPackageVersion(packageAbsolutePath, packageManifest, 'patch');
