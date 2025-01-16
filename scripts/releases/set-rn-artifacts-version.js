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

/*::
import type {BuildType, Version} from './utils/version-utils';
*/

const {REPO_ROOT} = require('../consts');
const {getNpmInfo} = require('../npm-utils');
const {parseVersion, validateBuildType} = require('./utils/version-utils');
const {promises: fs} = require('fs');
const path = require('path');
const {parseArgs} = require('util');

const GRADLE_FILE_PATH = path.join(
  REPO_ROOT,
  'packages/react-native/ReactAndroid/gradle.properties',
);

const config = {
  options: {
    'build-type': {
      type: 'string',
      short: 'b',
    },
    'to-version': {
      type: 'string',
      short: 'v',
    },
    help: {type: 'boolean'},
  },
};

/**
 * @deprecated This script entry point is deprecated. Please use `set-version`
 * instead.
 */
async function main() {
  const {
    values: {help, 'build-type': buildType, 'to-version': toVersion},
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/releases/set-rn-artifacts-version.js [OPTIONS]

  Updates relevant native files in the react-native package to materialize
  the given release version. This does not update package.json.

  Options:
    --build-type       One of ['dry-run', 'nightly', 'release', 'prealpha'].
    --to-version       The new version string.
    `);
    return;
  }

  if (!validateBuildType(buildType)) {
    throw new Error(`Unsupported build type: ${buildType}`);
  }

  await updateReactNativeArtifacts(
    toVersion ?? getNpmInfo(buildType).version,
    buildType,
  );
}

async function updateReactNativeArtifacts(
  version /*: string */,
  buildType /*: ?BuildType */,
) {
  const versionInfo = parseVersion(version, buildType);

  await updateSourceFiles(versionInfo);
  await updateGradleFile(versionInfo.version);
}

function updateSourceFiles(
  versionInfo /*: Version */,
) /*: Promise<Array<void>>*/ {
  const templateData = {version: versionInfo};

  return Promise.all([
    fs.writeFile(
      path.join(
        REPO_ROOT,
        'packages/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/systeminfo/ReactNativeVersion.java',
      ),
      require('./templates/ReactNativeVersion.java-template')(templateData),
    ),
    fs.writeFile(
      path.join(REPO_ROOT, 'packages/react-native/React/Base/RCTVersion.m'),
      require('./templates/RCTVersion.m-template')(templateData),
    ),
    fs.writeFile(
      path.join(
        REPO_ROOT,
        'packages/react-native/ReactCommon/cxxreact/ReactNativeVersion.h',
      ),
      require('./templates/ReactNativeVersion.h-template')(templateData),
    ),
    fs.writeFile(
      path.join(
        REPO_ROOT,
        'packages/react-native/Libraries/Core/ReactNativeVersion.js',
      ),
      require('./templates/ReactNativeVersion.js-template')(templateData),
    ),
  ]);
}

async function updateGradleFile(version /*: string */) /*: Promise<void> */ {
  const contents = await fs.readFile(GRADLE_FILE_PATH, 'utf-8');

  return fs.writeFile(
    GRADLE_FILE_PATH,
    contents.replace(/^VERSION_NAME=.*/, `VERSION_NAME=${version}`),
  );
}

module.exports = {
  updateReactNativeArtifacts,
  updateGradleFile,
  updateSourceFiles,
};

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
