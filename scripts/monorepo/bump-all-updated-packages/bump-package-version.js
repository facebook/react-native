/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {writeFileSync} = require('fs');
const path = require('path');

const getIncrementedVersion = (version, increment) =>
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
  packageAbsolutePath,
  packageManifest,
  increment = 'patch',
) => {
  const updatedVersion = getIncrementedVersion(
    packageManifest.version,
    increment,
  );

  // Not using simple `npm version patch` because it updates dependencies and yarn.lock file
  writeFileSync(
    path.join(packageAbsolutePath, 'package.json'),
    JSON.stringify({...packageManifest, version: updatedVersion}, null, 2) +
      '\n',
    'utf-8',
  );

  return updatedVersion;
};

module.exports = bumpPackageVersion;
