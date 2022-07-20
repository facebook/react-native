/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const SDKS_DIR = path.normalize(path.join(__dirname, '..', '..', 'sdks'));
const HERMES_DIR = path.join(SDKS_DIR, 'hermes');
const DEFAULT_HERMES_TAG = 'main';
const HERMES_TAG_FILE_PATH = path.join(SDKS_DIR, '.hermesversion');
const HERMES_TARBALL_BASE_URL = 'https://github.com/facebook/hermes/tarball/';
const HERMES_TARBALL_DOWNLOAD_DIR = path.join(SDKS_DIR, 'download');
const MACOS_BIN_DIR = path.join(SDKS_DIR, 'hermesc', 'osx-bin');
const MACOS_HERMESC_PATH = path.join(MACOS_BIN_DIR, 'hermesc');
const MACOS_IMPORT_HERMESC_PATH = path.join(
  MACOS_BIN_DIR,
  'ImportHermesc.cmake',
);

function readHermesTag() {
  if (fs.existsSync(HERMES_TAG_FILE_PATH)) {
    const data = fs
      .readFileSync(HERMES_TAG_FILE_PATH, {
        encoding: 'utf8',
        flag: 'r',
      })
      .trim();

    if (data.length > 0) {
      return data;
    } else {
      throw new Error('[Hermes] .hermesversion file is empty.');
    }
  }

  return 'main';
}

function setHermesTag(hermesTag) {
  if (readHermesTag() === hermesTag) {
    // No need to update.
    return;
  }

  if (!fs.existsSync(SDKS_DIR)) {
    fs.mkdirSync(SDKS_DIR, {recursive: true});
  }
  fs.writeFileSync(HERMES_TAG_FILE_PATH, hermesTag.trim());
  console.log('Hermes tag has been updated. Please commit your changes.');
}

function getHermesTagSHA(hermesTag) {
  return execSync(
    `git ls-remote https://github.com/facebook/hermes ${hermesTag} | cut -f 1`,
  )
    .toString()
    .trim();
}

function getHermesTarballDownloadPath(hermesTag) {
  const hermesTagSHA = getHermesTagSHA(hermesTag);
  return `${HERMES_TARBALL_DOWNLOAD_DIR}/hermes-${hermesTagSHA}.tgz`;
}

function downloadHermesTarball() {
  const hermesTag = readHermesTag();
  const hermesTagSHA = getHermesTagSHA(hermesTag);
  const hermesTarballDownloadPath = getHermesTarballDownloadPath(hermesTag);
  let hermesTarballUrl = HERMES_TARBALL_BASE_URL + hermesTag;

  if (fs.existsSync(hermesTarballDownloadPath)) {
    return;
  }

  if (!fs.existsSync(HERMES_TARBALL_DOWNLOAD_DIR)) {
    fs.mkdirSync(HERMES_TARBALL_DOWNLOAD_DIR, {recursive: true});
  }

  console.info(
    `[Hermes] Downloading Hermes source code for commit ${hermesTagSHA}`,
  );
  try {
    execSync(`curl ${hermesTarballUrl} -Lo ${hermesTarballDownloadPath}`);
  } catch (error) {
    throw new Error(`[Hermes] Failed to download Hermes tarball. ${error}`);
  }
}

function expandHermesTarball() {
  const hermesTag = readHermesTag();
  const hermesTagSHA = getHermesTagSHA(hermesTag);
  const hermesTarballDownloadPath = getHermesTarballDownloadPath(hermesTag);

  if (!fs.existsSync(hermesTarballDownloadPath)) {
    throw new Error('[Hermes] Could not locate Hermes tarball.');
  }

  if (!fs.existsSync(HERMES_DIR)) {
    fs.mkdirSync(HERMES_DIR, {recursive: true});
  }
  console.info(`[Hermes] Expanding Hermes tarball for commit ${hermesTagSHA}`);
  try {
    execSync(
      `tar -zxf ${hermesTarballDownloadPath} --strip-components=1 --directory ${HERMES_DIR}`,
    );
  } catch (error) {
    throw new Error('[Hermes] Failed to expand Hermes tarball.');
  }
}

function copyBuildScripts() {
  if (!fs.existsSync(SDKS_DIR)) {
    throw new Error(
      '[Hermes] Failed to copy Hermes build scripts, no SDKs directory found.',
    );
  }

  if (!fs.existsSync(HERMES_DIR)) {
    fs.mkdirSync(path.join(HERMES_DIR, 'utils'), {recursive: true});
  }

  fs.copyFileSync(
    `${SDKS_DIR}/hermes-engine/utils/build-apple-framework.sh`,
    `${HERMES_DIR}/utils/build-apple-framework.sh`,
  );
  fs.copyFileSync(
    `${SDKS_DIR}/hermes-engine/utils/build-ios-framework.sh`,
    `${HERMES_DIR}/utils/build-ios-framework.sh`,
  );
  fs.copyFileSync(
    `${SDKS_DIR}/hermes-engine/utils/build-mac-framework.sh`,
    `${HERMES_DIR}/utils/build-mac-framework.sh`,
  );
}

function copyPodSpec() {
  if (!fs.existsSync(SDKS_DIR)) {
    throw new Error(
      '[Hermes] Failed to copy Hermes Podspec, no SDKs directory found.',
    );
  }

  if (!fs.existsSync(HERMES_DIR)) {
    fs.mkdirSync(HERMES_DIR, {recursive: true});
  }
  fs.copyFileSync(
    path.join(SDKS_DIR, 'hermes-engine', 'hermes-engine.podspec'),
    path.join(HERMES_DIR, 'hermes-engine.podspec'),
  );
}

function isOnAReleaseBranch() {
  try {
    let currentBranch = execSync('git rev-parse --abbrev-ref HEAD')
      .toString()
      .trim();
    let currentRemote = execSync('git config --get remote.origin.url')
      .toString()
      .trim();
    return (
      currentBranch.endsWith('-stable') &&
      currentRemote.endsWith('facebook/react-native.git')
    );
  } catch (error) {
    // If not inside a git repo, we're going to fail here and return.
    return false;
  }
}

function isOnAReleaseTag() {
  try {
    // If on a named tag, this method will return the tag name.
    // If not, it will throw as the return code is not 0.
    execSync('git describe --exact-match HEAD', {stdio: 'ignore'});
  } catch (error) {
    return false;
  }
  let currentRemote = execSync('git config --get remote.origin.url')
    .toString()
    .trim();
  return currentRemote.endsWith('facebook/react-native.git');
}

function isPRAgainstStable(pullRequest) {
  if (pullRequest == null) {
    return false;
  }

  const prComponents = pullRequest.split('/');
  const prNumber = prComponents[prComponents.length - 1];
  const apiURL = `https://api.github.com/repos/facebook/react-native/pulls/${prNumber}`;
  const prJson = JSON.parse(execSync(`curl ${apiURL}`).toString());
  const baseBranch = prJson.base.label;

  return baseBranch.endsWith('-stable');
}

function shouldBuildHermesFromSource(pullRequest) {
  const hermesTag = readHermesTag();

  return (
    isOnAReleaseBranch() ||
    isOnAReleaseTag() ||
    isPRAgainstStable(pullRequest) ||
    hermesTag === DEFAULT_HERMES_TAG
  );
}

function shouldUsePrebuiltHermesC(os) {
  if (os === 'macos') {
    return fs.existsSync(MACOS_HERMESC_PATH);
  }

  return false;
}

function configureMakeForPrebuiltHermesC() {
  const IMPORT_HERMESC_TEMPLATE = `add_executable(native-hermesc IMPORTED)
set_target_properties(native-hermesc PROPERTIES
  IMPORTED_LOCATION "${MACOS_HERMESC_PATH}"
  )`;

  try {
    fs.mkdirSync(MACOS_BIN_DIR, {recursive: true});
    fs.writeFileSync(MACOS_IMPORT_HERMESC_PATH, IMPORT_HERMESC_TEMPLATE);
  } catch (error) {
    console.warn(
      `[Hermes] Re-compiling hermesc. Unable to configure make: ${error}`,
    );
  }
}

module.exports = {
  configureMakeForPrebuiltHermesC,
  copyBuildScripts,
  copyPodSpec,
  downloadHermesTarball,
  expandHermesTarball,
  getHermesTagSHA,
  readHermesTag,
  setHermesTag,
  shouldBuildHermesFromSource,
  shouldUsePrebuiltHermesC,
};
