/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {run, sleep, getNpmPackageInfo, log} = require('./utils.js');

const TAG_AS_LATEST_REGEX = /#publish-packages-to-npm&latest/;

/**
 * Should this commit be `latest` on npm?
 */
function isLatest() {
  const commitMessage = run('git log -n1 --pretty=%B');
  return TAG_AS_LATEST_REGEX.test(commitMessage);
}
module.exports.isLatest = isLatest;

/**
 * Create a Github Action to publish the community template matching the released version
 * of React Native.
 */
module.exports.publishTemplate = async (github, version, dryRun = true) => {
  log(`📤 Get the ${TEMPLATE_NPM_PKG} repo to publish ${version}`);

  const is_latest_on_npm = isLatest();

  const majorMinor = /^v?(\d+\.\d+)/.exec(version);

  if (!majorMinor) {
    log(`🔥 can't capture MAJOR.MINOR from '${version}', giving up.`);
    process.exit(1);
  }

  // MAJOR.MINOR-stable
  const ref = `${majorMinor[1]}-stable`;

  await github.rest.actions.createWorkflowDispatch({
    owner: 'react-native-community',
    repo: 'template',
    workflow_id: 'release.yml',
    ref,
    inputs: {
      dry_run: dryRun,
      is_latest_on_npm,
      // 0.75.0-rc.0, note no 'v' prefix
      version: version.replace(/^v/, ''),
    },
  });
};

const SLEEP_S = 10;
const MAX_RETRIES = 3 * 6; // 3 minutes
const TEMPLATE_NPM_PKG = '@react-native-community/template';

/**
 * Will verify that @latest and the @<version> have been published.
 *
 * NOTE: This will infinitely query each step until successful, make sure the
 *       calling job has a timeout.
 */
module.exports.verifyPublishedTemplate = async (
  version,
  latest = false,
  retries = MAX_RETRIES,
) => {
  log(`🔍 Is ${TEMPLATE_NPM_PKG}@${version} on npm?`);

  let count = retries;
  while (count-- > 0) {
    try {
      const json = await getNpmPackageInfo(
        TEMPLATE_NPM_PKG,
        latest ? 'latest' : version,
      );
      log(`🎉 Found ${TEMPLATE_NPM_PKG}@${version} on npm`);
      if (!latest) {
        return;
      }
      if (json.version === version) {
        log(`🎉 ${TEMPLATE_NPM_PKG}@latest → ${version} on npm`);
        return;
      }
      log(
        `🐌 ${TEMPLATE_NPM_PKG}@latest → ${pkg.version} on npm and not ${version} as expected, retrying...`,
      );
    } catch (e) {
      log(`Nope, fetch failed: ${e.message}`);
    }
    await sleep(SLEEP_S);
  }

  let msg = `🚨 Timed out when trying to verify ${TEMPLATE_NPM_PKG}@${version} on npm`;
  if (latest) {
    msg += ' and latest tag points to this version.';
  }
  log(msg);
  process.exit(1);
};
