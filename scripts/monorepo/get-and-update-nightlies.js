/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

const forEachPackage = require('./for-each-package');
const {rm} = require('shelljs');
const {
  getPackageVersionStrByTag,
  diffPackages,
  publishPackage,
  pack,
} = require('../npm-utils');
const {restore} = require('../scm-utils');
const path = require('path');
const {writeFileSync} = require('fs');

function hasChanges(
  currentNightlyVersion,
  packageManifest,
  packageAbsolutePath,
) {
  // Set local package to same nightly version so diff is comparable
  writeFileSync(
    path.join(packageAbsolutePath, 'package.json'),
    JSON.stringify(
      {...packageManifest, version: currentNightlyVersion},
      null,
      2,
    ) + '\n',
    'utf-8',
  );

  // prepare local package
  pack(packageAbsolutePath);

  // ex. react-native-codegen-0.73.0-nightly-20230530-730ca3540.tgz
  const localTarballName = `${packageManifest.name
    .replace('@', '')
    .replace('/', '-')}-${currentNightlyVersion}.tgz`;

  // npm diff --diff=<package-name>@nightly --diff=. --diff-name-only
  const diff = diffPackages(
    `${packageManifest.name}@nightly`,
    localTarballName,
    {
      cwd: packageAbsolutePath,
    },
  );

  // delete tarball and restore package.json changes
  rm(path.join(packageAbsolutePath, localTarballName));
  restore(packageAbsolutePath);

  return diff.trim().length !== 0;
}

/**
 * Get the latest nightly version of each monorepo package and publishes a new nightly if there have been updates.
 * Returns a map of monorepo packages and its latest nightly version.
 *
 * This is called by `react-native`'s nightly job.
 * Note: This does not publish `package/react-native`'s nightly. That is handled in `publish-npm`.
 */
function getAndUpdateNightlies(nightlyVersion) {
  const nightlyVersions = {};

  forEachPackage(
    (packageAbsolutePath, packageRelativePathFromRoot, packageManifest) => {
      if (packageManifest.private) {
        console.log(`\u23ED Skipping private package ${packageManifest.name}`);

        return;
      }

      let lastPublishedNightlyVersion;
      let shouldPublishNightly = false;
      console.log(
        `\n---- Attempting to publish nightly for ${packageManifest.name}`,
      );
      try {
        lastPublishedNightlyVersion = getPackageVersionStrByTag(
          packageManifest.name,
          'nightly',
        );
        shouldPublishNightly = hasChanges(
          lastPublishedNightlyVersion,
          packageManifest,
          packageAbsolutePath,
        );
      } catch (e) {
        console.error(
          `Unable to verify if ${packageManifest.name} has changes due to error:`,
        );
        console.error(e.message);
        console.log(`\u23ED Skipping package ${packageManifest.name}`);
        return;
      }

      if (!shouldPublishNightly) {
        console.log(
          `Detected no changes in ${packageManifest.name}@nightly since last publish. Skipping.`,
        );
        nightlyVersions[packageManifest.name] = lastPublishedNightlyVersion;
        return;
      }

      // Set the local package to the updated nightly version
      writeFileSync(
        path.join(packageAbsolutePath, 'package.json'),
        JSON.stringify({...packageManifest, version: nightlyVersion}, null, 2) +
          '\n',
        'utf-8',
      );

      const result = publishPackage(packageAbsolutePath, {
        tag: 'nightly',
        otp: process.env.NPM_CONFIG_OTP,
      });
      if (result.code !== 0) {
        console.log(
          `\u274c Failed to publish version ${nightlyVersion} of ${packageManifest.name}. npm publish exited with code ${result.code}:`,
        );
        console.error(result.stderr);
      } else {
        console.log(
          `\u2705 Successfully published new version of ${packageManifest.name}`,
        );
        nightlyVersions[packageManifest.name] = nightlyVersion;
      }
    },
  );
  return nightlyVersions;
}

module.exports = getAndUpdateNightlies;
