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

const {parseVersion, validateBuildType} = require('./utils/version-utils');
const {parseArgs} = require('@pkgjs/parseargs');

const config = {
  options: {
    'build-type': {
      type: 'string',
      short: 'b',
    },
    version: {
      type: 'string',
      short: 'v',
    },
    help: {type: 'boolean'},
  },
};

async function main() {
  const {
    values: {help, 'build-type': buildType, version: version},
  } = parseArgs(config);

  if (help) {
    console.log(`
        Usage: node ./scripts/releases/validate-version.js [OPTIONS]

        Validates a version string for a given build type.

        Options:
        --build-type       One of ['dry-run', 'nightly', 'release', 'prealpha'].
        --version       The new version string.
        `);
    return;
  }

  if (!validateBuildType(buildType)) {
    throw new Error(`Unsupported build type: ${buildType}`);
  }

  parseVersion(version, 'release');

  console.log(`Version ${version} is valid for ${buildType} build.`);
  return;
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
