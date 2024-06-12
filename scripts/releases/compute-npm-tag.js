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

const {parseVersion} = require('./utils/version-utils');
const {parseArgs} = require('@pkgjs/parseargs');

const config = {
  options: {
    is_latest_on_npm: {
      type: 'boolean',
      short: 'l',
      default: false,
    },
    version: {
      type: 'string',
      short: 'v',
    },
    branch: {
      type: 'string',
      short: 'b',
    },
    help: {type: 'boolean'},
  },
};

async function main() {
  const {
    values: {help, is_latest_on_npm: latest, version: version, branch: branch},
  } = parseArgs(config);

  if (help) {
    console.log(`
        Usage: node ./scripts/releases/compute-npm-tag.js [OPTIONS]

        Validates a version string for a given build type.

        Options:
        --is-latest-on-npm    Whether we need to publish this as latest on NPM or not. Defaults to false.
        --version             The new version string.
        --branch              The branch name.
        `);
    return;
  }

  const {prerelease} = parseVersion(version, 'release');

  const npmTag = latest ? 'latest' : !prerelease ? branch : 'next';

  console.log(npmTag);
  return;
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
