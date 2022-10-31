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
const os = require('os');
const path = require('path');
const {execSync} = require('child_process');

const SDKS_DIR = path.normalize(path.join(__dirname, '..', '..', 'sdks'));
const HERMES_DIR = path.join(SDKS_DIR, 'hermes');
const HERMES_TAG_FILE_PATH = path.join(SDKS_DIR, '.hermesversion');
const HERMES_SOURCE_TARBALL_BASE_URL =
  'https://github.com/facebook/hermes/tarball/';
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
  return path.join(HERMES_TARBALL_DOWNLOAD_DIR, `hermes-${hermesTagSHA}.tgz`);
}

function downloadHermesSourceTarball() {
  const hermesTag = readHermesTag();
  const hermesTagSHA = getHermesTagSHA(hermesTag);
  const hermesTarballDownloadPath = getHermesTarballDownloadPath(hermesTag);
  let hermesTarballUrl = HERMES_SOURCE_TARBALL_BASE_URL + hermesTag;

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

function expandHermesSourceTarball() {
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
    path.join(SDKS_DIR, 'hermes-engine', 'utils', 'build-apple-framework.sh'),
    path.join(HERMES_DIR, 'utils', 'build-apple-framework.sh'),
  );
  fs.copyFileSync(
    path.join(SDKS_DIR, 'hermes-engine', 'utils', 'build-ios-framework.sh'),
    path.join(HERMES_DIR, 'utils', 'build-ios-framework.sh'),
  );
  fs.copyFileSync(
    path.join(SDKS_DIR, 'hermes-engine', 'utils', 'build-mac-framework.sh'),
    path.join(HERMES_DIR, 'utils', 'build-mac-framework.sh'),
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
  const podspec = 'hermes-engine.podspec';
  fs.copyFileSync(
    path.join(SDKS_DIR, 'hermes-engine', podspec),
    path.join(HERMES_DIR, podspec),
  );
  const utils = 'hermes-utils.rb';
  fs.copyFileSync(
    path.join(SDKS_DIR, 'hermes-engine', utils),
    path.join(HERMES_DIR, utils),
  );
}

function isTestingAgainstLocalHermesTarball() {
  return 'HERMES_ENGINE_TARBALL_PATH' in process.env;
}

function shouldBuildHermesFromSource(isInCI) {
  return !isTestingAgainstLocalHermesTarball() && isInCI;
}

function shouldUsePrebuiltHermesC(platform) {
  if (platform === 'macos') {
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

function getHermesPrebuiltArtifactsTarballName(buildType, releaseVersion) {
  if (!buildType) {
    throw Error('Did not specify build type.');
  }
  if (!releaseVersion) {
    throw Error('Did not specify release version.');
  }
  return `hermes-runtime-darwin-${buildType.toLowerCase()}-v${releaseVersion}.tar.gz`;
}

function createHermesPrebuiltArtifactsTarball(
  hermesDir,
  buildType,
  releaseVersion,
  tarballOutputDir,
) {
  if (!hermesDir) {
    hermesDir = HERMES_DIR;
  }
  if (!fs.existsSync(hermesDir)) {
    throw new Error(`Path to Hermes does not exist at ${hermesDir}`);
  }
  if (!fs.existsSync(path.join(hermesDir, 'destroot'))) {
    throw new Error(
      `destroot not found at ${path.join(
        hermesDir,
        'destroot',
      )}. Are you sure Hermes has been built?`,
    );
  }
  if (!fs.existsSync(tarballOutputDir)) {
    fs.mkdirSync(tarballOutputDir, {recursive: true});
  }

  let tarballTempDir;

  try {
    tarballTempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'hermes-engine-destroot-'),
    );

    execSync(`cp -R ./destroot ${tarballTempDir}`, {cwd: hermesDir});
    if (fs.existsSync(path.join(hermesDir, 'LICENSE'))) {
      execSync(`cp LICENSE ${tarballTempDir}`, {cwd: hermesDir});
    }
  } catch (error) {
    throw new Error(`Failed to copy destroot to tempdir: ${error}`);
  }

  const tarballFilename = getHermesPrebuiltArtifactsTarballName(
    buildType,
    releaseVersion,
  );
  const tarballOutputPath = path.join(tarballOutputDir, tarballFilename);

  try {
    execSync(`tar -C ${tarballTempDir} -czvf ${tarballOutputPath} .`);
  } catch (error) {
    throw new Error(`[Hermes] Failed to create tarball: ${error}`);
  }

  if (!fs.existsSync(tarballOutputPath)) {
    throw new Error(
      `Tarball creation failed, could not locate tarball at ${tarballOutputPath}`,
    );
  }

  return tarballOutputPath;
}

module.exports = {
  configureMakeForPrebuiltHermesC,
  copyBuildScripts,
  copyPodSpec,
  createHermesPrebuiltArtifactsTarball,
  downloadHermesSourceTarball,
  expandHermesSourceTarball,
  getHermesTagSHA,
  getHermesPrebuiltArtifactsTarballName,
  readHermesTag,
  setHermesTag,
  shouldBuildHermesFromSource,
  shouldUsePrebuiltHermesC,
};
