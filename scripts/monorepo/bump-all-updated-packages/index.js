/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const path = require('path');
const {echo, exec, exit} = require('shelljs');
const yargs = require('yargs');

const {BUMP_COMMIT_MESSAGE} = require('../constants');
const forEachPackage = require('../for-each-package');
const checkForGitChanges = require('../check-for-git-changes');
const bumpPackageVersion = require('./bump-package-version');

const ROOT_LOCATION = path.join(__dirname, '..', '..', '..');

const {
  argv: {releaseBranchCutoff},
} = yargs
  .option('release-branch-cutoff', {
    type: 'boolean',
    describe: 'Should force bump minor version for each public package',
  })
  .strict();

const buildExecutor =
  (packageAbsolutePath, packageRelativePathFromRoot, packageManifest) =>
  async () => {
    const {name: packageName} = packageManifest;
    if (packageManifest.private) {
      echo(`\u23ED Skipping private package ${chalk.dim(packageName)}`);

      return;
    }

    if (releaseBranchCutoff) {
      const updatedVersion = bumpPackageVersion(
        packageAbsolutePath,
        packageManifest,
        'minor',
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
      .prompt([
        {
          type: 'list',
          name: 'shouldBumpPackage',
          message: `Do you want to bump ${packageName}?`,
          choices: ['Yes', 'No'],
          filter: val => val === 'Yes',
        },
      ])
      .then(({shouldBumpPackage}) => {
        if (!shouldBumpPackage) {
          echo(`Skipping bump for ${packageName}`);
          return;
        }

        return inquirer
          .prompt([
            {
              type: 'list',
              name: 'increment',
              message: 'Which version you want to increment?',
              choices: ['patch', 'minor'],
            },
          ])
          .then(({increment}) => {
            const updatedVersion = bumpPackageVersion(
              packageAbsolutePath,
              packageManifest,
              increment,
            );
            echo(
              `\u2705 Successfully bumped ${chalk.green(
                packageName,
              )} to ${chalk.green(updatedVersion)}`,
            );
          });
      });
  };

const buildAllExecutors = () => {
  const executors = [];

  forEachPackage((...params) => {
    executors.push(buildExecutor(...params));
  });

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
      .prompt([
        {
          type: 'list',
          name: 'shouldSubmitCommit',
          message: 'Do you want to submit a commit with these changes?',
          choices: ['Yes', 'No'],
          filter: val => val === 'Yes',
        },
      ])
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
