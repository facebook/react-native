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
const {applyPackageVersions} = require('../npm-utils');
const {getNpmInfo} = require('../npm-utils');
const updateTemplatePackage = require('./update-template-package');
const {parseVersion, validateBuildType} = require('./utils/version-utils');
const {parseArgs} = require('@pkgjs/parseargs');
const {promises: fs} = require('fs');
const path = require('path');

const GRADLE_FILE_PATH = path.join(
  REPO_ROOT,
  'packages/react-native/ReactAndroid/gradle.properties',
);
const REACT_NATIVE_PACKAGE_JSON = path.join(
  REPO_ROOT,
  'packages/react-native/package.json',
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

async function main() {
  const {
    values: {help, 'build-type': buildType, 'to-version': toVersion},
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/releases/set-rn-version.js [OPTIONS]

  Updates relevant files in the react-native package and template to
  materialize the given release version.

  Options:
    --build-type       One of ['dry-run', 'nightly', 'release', 'prealpha'].
    --to-version       The new version string.
    `);
    return;
  }

  if (!validateBuildType(buildType)) {
    throw new Error(`Unsupported build type: ${buildType}`);
  }

  await setReactNativeVersion(
    toVersion ?? getNpmInfo(buildType).version,
    {},
    buildType,
  );
}

async function setReactNativeVersion(
  version /*: string */,
  dependencyVersions /*: ?Record<string, string> */,
  buildType /*: ?BuildType */,
) {
  const versionInfo = parseVersion(version, buildType);

  updateTemplatePackage({
    ...(dependencyVersions ?? {}),
    'react-native': versionInfo.version,
  });
  await updateSourceFiles(versionInfo);
  await setReactNativePackageVersion(versionInfo.version, dependencyVersions);
  await updateGradleFile(versionInfo.version);
}

async function setReactNativePackageVersion(
  version /*: string */,
  dependencyVersions /*: ?Record<string, string> */,
) {
  const originalPackageJsonContent = await fs.readFile(
    REACT_NATIVE_PACKAGE_JSON,
    'utf-8',
  );
  const originalPackageJson = JSON.parse(originalPackageJsonContent);

  const packageJson =
    dependencyVersions != null
      ? applyPackageVersions(originalPackageJson, dependencyVersions)
      : originalPackageJson;

  packageJson.version = version;

  await fs.writeFile(
    path.join(REPO_ROOT, 'packages/react-native/package.json'),
    JSON.stringify(packageJson, null, 2) + '\n',
  );
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
  setReactNativeVersion,
  updateGradleFile,
  updateSourceFiles,
};

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
