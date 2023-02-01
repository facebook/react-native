/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import {echo, exec, exit} from 'shelljs';
import yargs from 'yargs';

import {BUMP_COMMIT_MESSAGE} from '../constants';
const forEachPackage = require('../for-each-package');
import checkForGitChanges from '../check-for-git-changes';
import {
  bumpPackageMinorVersion,
  bumpPackagePatchVersion,
} from './bump-package-version';

import {PackageManifest} from '../../../types/private/PackageManifest';

const ROOT_LOCATION = path.join(__dirname, '..', '..', '..');

const {releaseBranchCutoff} = yargs
  .option('releaseBranchCutoff', {
    alias: 'release-branch-cutoff',
    type: 'boolean',
    describe: 'Should force bump minor version for each public package',
  })
  .strict()
  .parseSync();

const buildExecutor =
  (
    packageAbsolutePath: string,
    packageRelativePathFromRoot: string,
    packageManifest: PackageManifest,
  ) =>
  async () => {
    const {name: packageName} = packageManifest;
    if (packageManifest.private) {
      echo(`\u23ED Skipping private package ${chalk.dim(packageName)}`);

      return;
    }

    if (releaseBranchCutoff) {
      const updatedVersion = bumpPackageMinorVersion(
        packageAbsolutePath,
        packageManifest,
      );
      echo(
        `\u2705 Successfully bumped ${chalk.green(
          packageName,
        )} to ${chalk.green(updatedVersion)}`,
      );

      return;
    }

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

      return;
    }

    echo(`\uD83D\uDCA1 Found changes for ${chalk.yellow(packageName)}:`);
    exec(
      `git log --pretty=oneline ${hashOfLastCommitThatChangedVersion}..${hashOfLastCommitInsidePackage} ${packageRelativePathFromRoot}`,
      {
        cwd: ROOT_LOCATION,
      },
    );
    echo();

    await inquirer
      .prompt<{shouldBumpPackage: boolean}>({
        type: 'list',
        name: 'shouldBumpPackage',
        message: `Do you want to bump ${packageName}?`,
        choices: ['Yes', 'No'],
        filter: (val?: string): boolean => val === 'Yes',
      })
      .then(({shouldBumpPackage}) => {
        if (!shouldBumpPackage) {
          echo(`Skipping bump for ${packageName}`);
          return;
        }

        return inquirer
          .prompt<{increment: 'minor' | 'patch'}>({
            type: 'list',
            name: 'increment',
            message: 'Which version you want to increment?',
            choices: ['patch', 'minor'],
          })
          .then(({increment}) => {
            const updatedVersion =
              increment === 'minor'
                ? bumpPackageMinorVersion(packageAbsolutePath, packageManifest)
                : bumpPackagePatchVersion(packageAbsolutePath, packageManifest);

            echo(
              `\u2705 Successfully bumped ${chalk.green(
                packageName,
              )} to ${chalk.green(updatedVersion)}`,
            );
          });
      });
  };

const buildAllExecutors = () => {
  const executors: (() => Promise<any>)[] = [];

  forEachPackage(
    (
      packageAbsolutePath: string,
      packageRelativePathFromRoot: string,
      packageManifest: PackageManifest,
    ) => {
      executors.push(
        buildExecutor(
          packageAbsolutePath,
          packageRelativePathFromRoot,
          packageManifest,
        ),
      );
    },
  );

  return executors;
};

const main = async () => {
  if (checkForGitChanges()) {
    echo(
      chalk.red(
        'Found uncommitted changes. Please commit or stash them before running this script',
      ),
    );
    exit(1);
  }

  const executors = buildAllExecutors();
  for (const executor of executors) {
    await executor()
      .catch(() => exit(1))
      .then(() => echo());
  }

  if (checkForGitChanges()) {
    await inquirer
      .prompt<{shouldSubmitCommit: boolean}>({
        type: 'list',
        name: 'shouldSubmitCommit',
        message: 'Do you want to submit a commit with these changes?',
        choices: ['Yes', 'No'],
        filter: (val?: string): boolean => val === 'Yes',
      })
      .then(({shouldSubmitCommit}) => {
        if (!shouldSubmitCommit) {
          echo('Not submitting a commit, but keeping all changes');
          return;
        }

        exec(`git commit -a -m "${BUMP_COMMIT_MESSAGE}"`, {cwd: ROOT_LOCATION});
      })
      .then(() => echo());
  }

  echo(chalk.green('Successfully finished the process of bumping packages'));
  exit(0);
};

main();
