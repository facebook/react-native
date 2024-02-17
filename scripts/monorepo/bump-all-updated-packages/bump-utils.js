/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const chalk = require('chalk');
const {echo, exec} = require('shelljs');

const detectPackageUnreleasedChanges = (
  packageRelativePathFromRoot,
  packageName,
  ROOT_LOCATION,
) => {
  const hashOfLastCommitInsidePackage = exec(
    `git log -n 1 --format=format:%H -- ${packageRelativePathFromRoot}`,
    {cwd: ROOT_LOCATION, silent: true},
  ).stdout.trim();

  const hashOfLastCommitThatChangedVersion = exec(
    `git log -G\\"version\\": --format=format:%H -n 1 -- ${packageRelativePathFromRoot}/package.json`,
    {cwd: ROOT_LOCATION, silent: true},
  ).stdout.trim();

  if (hashOfLastCommitInsidePackage === hashOfLastCommitThatChangedVersion) {
    echo(
      `\uD83D\uDD0E No changes for package ${chalk.green(
        packageName,
      )} since last version bump`,
    );
    return false;
  } else {
    echo(`\uD83D\uDCA1 Found changes for ${chalk.yellow(packageName)}:`);
    exec(
      `git log --pretty=oneline ${hashOfLastCommitThatChangedVersion}..${hashOfLastCommitInsidePackage} ${packageRelativePathFromRoot}`,
      {
        cwd: ROOT_LOCATION,
      },
    );
    echo();

    return true;
  }
};

module.exports = detectPackageUnreleasedChanges;
