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
const {echo, exec, exit} = require('shelljs');

const SDKS_DIR = path.normalize(path.join(__dirname, '..', '..', 'sdks'));
const HERMES_DIR = path.join(SDKS_DIR, 'hermes');
const HERMES_TAG_FILE_PATH = path.join(SDKS_DIR, '.hermesversion');
const HERMES_TARBALL_BASE_URL = 'https://github.com/facebook/hermes/tarball/';
const HERMES_TARBALL_DOWNLOAD_DIR = path.join(SDKS_DIR, 'download');
const MACOS_BIN_DIR = path.join(SDKS_DIR, 'hermesc', 'osx-bin');
const MACOS_HERMESC_PATH = path.join(MACOS_BIN_DIR, 'hermesc');
const MACOS_IMPORT_HERMESC_PATH = path.join(
  MACOS_BIN_DIR,
  'ImportHermesc.cmake',
);

function prepareFileSystem() {
  if (!fs.existsSync(SDKS_DIR)) {
    fs.mkdirSync(SDKS_DIR, {recursive: true});
  }

  if (!fs.existsSync(HERMES_DIR)) {
    fs.mkdirSync(HERMES_DIR, {recursive: true});
  }

  if (!fs.existsSync(HERMES_TARBALL_DOWNLOAD_DIR)) {
    fs.mkdirSync(HERMES_TARBALL_DOWNLOAD_DIR, {recursive: true});
  }
}

function readHermesTag() {
  if (fs.existsSync(HERMES_TAG_FILE_PATH)) {
    const data = fs.readFileSync(HERMES_TAG_FILE_PATH, {
      encoding: 'utf8',
      flag: 'r',
    });
    return data.trim();
  } else {
    return 'main';
  }
}

function setHermesTag(hermesTag) {
  if (readHermesTag() === hermesTag) {
    // No need to update.
    return;
  }

  prepareFileSystem();

  fs.writeFileSync(HERMES_TAG_FILE_PATH, hermesTag.trim());
  console.log('Hermes tag has been updated. Please commit your changes.');
}

function getHermesTagSHA(hermesTag) {
  return exec(
    `git ls-remote https://github.com/facebook/hermes ${hermesTag} | cut -f 1`,
    {silent: true},
  ).trim();
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

  prepareFileSystem();

  if (fs.existsSync(hermesTarballDownloadPath)) {
    return;
  }

  echo(`[Hermes] Downloading Hermes source code for commit ${hermesTagSHA}`);
  if (exec(`curl ${hermesTarballUrl} -Lo ${hermesTarballDownloadPath}`).code) {
    echo('[Hermes] Failed to download Hermes tarball.');
    exit(1);
    return;
  }
}

function expandHermesTarball() {
  const hermesTag = readHermesTag();
  const hermesTagSHA = getHermesTagSHA(hermesTag);
  const hermesTarballDownloadPath = getHermesTarballDownloadPath(hermesTag);

  prepareFileSystem();

  if (!fs.existsSync(hermesTarballDownloadPath)) {
    echo(
      `[Hermes] Failed to expand Hermes tarball, no file found at ${hermesTarballDownloadPath}.`,
    );
    exit(1);
    return;
  }

  echo(`[Hermes] Expanding Hermes tarball for commit ${hermesTagSHA}`);
  if (
    exec(
      `tar -zxf ${hermesTarballDownloadPath} --strip-components=1 --directory ${HERMES_DIR}`,
    ).code
  ) {
    echo('[Hermes] Failed to expand Hermes tarball.');
    exit(1);
    return;
  }
}

function copyBuildScripts() {
  fs.copyFileSync(
    `${SDKS_DIR}/hermes-engine/hermes-engine.podspec`,
    `${HERMES_DIR}/hermes-engine.podspec`,
  );
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

  fs.mkdirSync(MACOS_BIN_DIR, {recursive: true});
  fs.writeFileSync(MACOS_IMPORT_HERMESC_PATH, IMPORT_HERMESC_TEMPLATE);
}

module.exports = {
  configureMakeForPrebuiltHermesC,
  copyBuildScripts,
  downloadHermesTarball,
  expandHermesTarball,
  getHermesTagSHA,
  readHermesTag,
  setHermesTag,
  shouldUsePrebuiltHermesC,
};
