#!/usr/bin/env node
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script walks a releaser through bumping the version for a release
 * It will commit the appropriate tags to trigger the CircleCI jobs.
 */
const {exec, exit} = require('shelljs');
const yargs = require('yargs');
const inquirer = require('inquirer');
const {
  parseVersion,
  isReleaseBranch,
  getBranchName,
} = require('./version-utils');

let argv = yargs
  .option('r', {
    alias: 'remote',
    default: 'origin',
  })
  .check(() => {
    const branch = getBranchName();
    exitIfNotOnReleaseBranch(branch);
    return true;
  }).argv;

function exitIfNotOnReleaseBranch(branch) {
  if (!isReleaseBranch(branch)) {
    console.log(
      'This script must be run in a react-native git repository checkout and on a release branch',
    );
    exit(1);
  }
}

function getLatestTag(versionPrefix) {
  const tags = exec(`git tag --list "v${versionPrefix}*" --sort=-refname`, {
    silent: true,
  })
    .stdout.trim()
    .split('\n')
    .filter(tag => tag.length > 0);
  if (tags.length > 0) {
    return tags[0];
  }
  return null;
}

async function main() {
  const branch = getBranchName();

  const {pulled} = await inquirer.prompt({
    type: 'confirm',
    name: 'pulled',
    message: `You are currently on branch: ${branch}. Have you run "git pull ${argv.remote} ${branch} --tags"?`,
  });

  if (!pulled) {
    console.log(`Please run 'git pull ${argv.remote} ${branch} --tags'`);
    exit(1);
    return;
  }

  const lastVersionTag = getLatestTag(branch.replace('-stable', ''));
  const lastVersion = lastVersionTag
    ? parseVersion(lastVersionTag).version
    : null;
  const lastVersionMessage = lastVersion
    ? `Last version tagged is ${lastVersion}.\n`
    : '';

  const {releaseVersion} = await inquirer.prompt({
    type: 'input',
    name: 'releaseVersion',
    message: `What version are you releasing? (Ex. 0.66.0-rc.4)\n${lastVersionMessage}`,
  });

  let setLatest = false;

  const {version, prerelease} = parseVersion(releaseVersion);
  if (!prerelease) {
    const {latest} = await inquirer.prompt({
      type: 'confirm',
      name: 'latest',
      message: 'Set this version as "latest" on npm?',
    });
    setLatest = latest;
  }
  const npmTag = setLatest ? 'latest' : !prerelease ? branch : 'next';
  const {confirmRelease} = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmRelease',
    message: `Releasing version "${version}" with npm tag "${npmTag}". Is this correct?`,
  });

  if (!confirmRelease) {
    console.log('Aborting.');
    return;
  }

  if (
    exec(`git tag -a publish-v${version} -m "publish version ${version}"`).code
  ) {
    console.error(`Failed to tag publish-v${version}`);
    exit(1);
    return;
  }

  if (setLatest) {
    exec('git tag -d latest');
    exec(`git push ${argv.remote} :latest`);
    exec('git tag -a latest -m "latest"');
  }

  if (exec(`git push ${argv.remote} ${branch} --follow-tags`).code) {
    console.error(`Failed to push tag publish-v${version}`);
    exit(1);
    return;
  }

  // TODO
  // 1. Link to CircleCI job to watch
  // 2. Output the release changelog to paste into Github releases
  // 3. Link to release discussions to update
  // 4. Verify RN-diff publish is through
  // 5. General changelog update on PR?
}

main().then(() => {
  exit(0);
});
