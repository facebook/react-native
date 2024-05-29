/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

'use strict';

const checkForGitChanges = require('../monorepo/check-for-git-changes');
const {failIfTagExists} = require('../releases/utils/release-utils');
const {
  isReleaseBranch,
  parseVersion,
} = require('../releases/utils/version-utils');
const {exitIfNotOnGit, getBranchName} = require('../scm-utils');
const {getPackages} = require('../utils/monorepo');
const chalk = require('chalk');
const inquirer = require('inquirer');
const request = require('request');
const {echo, exit} = require('shelljs');
const yargs = require('yargs');

/**
 * This script walks a releaser through bumping the version for a release
 * It will commit the appropriate tags to trigger the CircleCI jobs.
 */

let argv = yargs
  .option('r', {
    alias: 'remote',
    default: 'origin',
  })
  .option('t', {
    alias: 'token',
    describe:
      'Your CircleCI personal API token. See https://circleci.com/docs/2.0/managing-api-tokens/#creating-a-personal-api-token to set one',
    required: true,
  })
  .option('v', {
    alias: 'to-version',
    describe: 'Version you aim to release, ex. 0.67.0-rc.1, 0.66.3',
    required: true,
  })
  .option('dry-run', {
    type: 'boolean',
    default: false,
  })
  .check(() => {
    const branch = exitIfNotOnGit(
      () => getBranchName(),
      "Not in git. You can't invoke trigger-react-native-release from outside a git repo.",
    );
    exitIfNotOnReleaseBranch(branch);
    return true;
  }).argv;

function exitIfNotOnReleaseBranch(branch /*: string */) {
  if (!isReleaseBranch(branch)) {
    console.log(
      'This script must be run in a react-native git repository checkout and on a release branch',
    );
    exit(1);
  }
}

/**
 * Get the next version that all workspace packages will be set to.
 *
 * This approach is specific to the 0.74 release. For 0.75, the `--to-version`
 * value will be used instead, setting all packages to a single version.
 */
async function getNextMonorepoPackagesVersion() /*: Promise<string | null> */ {
  // Based on last publish before this strategy
  const _0_74_MIN_PATCH = 75;

  const packages = await getPackages({
    includeReactNative: false,
  });

  let patchVersion = _0_74_MIN_PATCH;

  for (const pkg of Object.values(packages)) {
    const {version} = pkg.packageJson;

    if (!version.startsWith('0.74.') || version.endsWith('-main')) {
      return null;
    }

    const {patch} = parseVersion(version, 'release');
    patchVersion = Math.max(patchVersion, parseInt(patch, 10) + 1);
  }

  return '0.74.' + patchVersion;
}

function triggerReleaseWorkflow(options /*: $FlowFixMe */) {
  return new Promise((resolve, reject) => {
    request(options, function (error, response, body) {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

async function main() {
  const branch = exitIfNotOnGit(
    () => getBranchName(),
    "Not in git. You can't invoke trigger-react-native-release from outside a git repo.",
  );

  // check for uncommitted changes
  if (checkForGitChanges()) {
    echo(
      chalk.red(
        'Found uncommitted changes. Please commit or stash them before running this script',
      ),
    );
    exit(1);
  }

  // $FlowFixMe[prop-missing]
  const token = argv.token;
  // $FlowFixMe[prop-missing]
  const releaseVersion = argv.toVersion;
  failIfTagExists(releaseVersion, 'release');

  const {pushed} = await inquirer.prompt({
    type: 'confirm',
    name: 'pushed',
    message: `This script will trigger a release with whatever changes are on the remote branch: ${branch}. \nMake sure you have pushed any updates remotely.`,
  });

  if (!pushed) {
    // $FlowFixMe[prop-missing]
    console.log(`Please run 'git push ${argv.remote} ${branch}'`);
    exit(1);
    return;
  }

  let latest = false;
  const {version, prerelease} = parseVersion(releaseVersion, 'release');
  if (!prerelease) {
    const {setLatest} = await inquirer.prompt({
      type: 'confirm',
      name: 'setLatest',
      message: `Do you want to set ${version} as "latest" release on npm?`,
    });
    latest = setLatest;
  }

  const npmTag = latest ? 'latest' : !prerelease ? branch : 'next';
  const {confirmRelease} = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmRelease',
    message: `Releasing version "${version}" with npm tag "${npmTag}". Is this correct?`,
  });

  if (!confirmRelease) {
    console.log('Aborting.');
    return;
  }

  let nextMonorepoPackagesVersion = await getNextMonorepoPackagesVersion();

  if (nextMonorepoPackagesVersion == null) {
    // TODO(T182538198): Once this warning is hit, we can remove the
    // `release_monorepo_packages_version` logic from here and the CI jobs,
    // see other TODOs.
    console.warn(
      'Warning: No longer on the 0.74-stable branch, meaning we will ' +
        'write all package versions identically. Please double-check the ' +
        'generated diff to see if this is correct.',
    );
    nextMonorepoPackagesVersion = version;
  }

  const parameters = {
    run_release_workflow: true,
    release_version: version,
    release_tag: npmTag,
    // NOTE: Necessary for 0.74, should be dropped for 0.75+
    release_monorepo_packages_version: nextMonorepoPackagesVersion,
    // $FlowFixMe[prop-missing]
    release_dry_run: argv.dryRun,
  };

  const options = {
    method: 'POST',
    url: 'https://circleci.com/api/v2/project/github/facebook/react-native/pipeline',
    headers: {
      'Circle-Token': token,
      'content-type': 'application/json',
    },
    body: {
      branch,
      parameters,
    },
    json: true,
  };

  // See response: https://circleci.com/docs/api/v2/#operation/triggerPipeline
  const body = await triggerReleaseWorkflow(options);
  console.log(
    // $FlowFixMe[incompatible-use]
    `Monitor your release workflow: https://app.circleci.com/pipelines/github/facebook/react-native/${body.number}`,
  );

  // TODO
  // - Output the release changelog to paste into Github releases
  // - Link to release discussions to update
  // - Verify RN-diff publish is through
}

// $FlowFixMe[unused-promise]
main().then(() => {
  exit(0);
});
