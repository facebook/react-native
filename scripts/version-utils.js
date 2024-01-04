/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const VERSION_REGEX = /^v?((\d+)\.(\d+)\.(\d+)(?:-(.+))?)$/;

/**
 * Parses a version string and performs some checks to verify its validity.
 * A valid version is in the format vX.Y.Z[-KKK] where X, Y, Z are numbers and KKK can be something else.
 * The `builtType` is used to enforce that the major version can assume only specific
 * values.
 *
 * Some examples of valid versions are:
 * - stable: 0.68.1
 * - stable prerelease: 0.70.0-rc.0
 * - e2e-test: X.Y.Z-20221116-2018
 * - nightly: X.Y.Z-20221116-0bc4547fc
 * - dryrun: 1000.0.0
 * - prealpha: 0.0.0-prealpha-20221116
 *
 * Parameters:
 * - @versionStr the string representing a version
 * - @buildType the build type. It can be of values: `dry-run`, `release`, `nightly`
 *
 * Returns: an object with the shape:
 * ```
 * {
 *   version: string,
 *   major: number,
 *   minor: number,
 *   patch: number,
 *   prerelease: string
 * }
 * ```
 *
 */
function parseVersion(versionStr, buildType) {
  validateBuildType(buildType);

  const match = extractMatchIfValid(versionStr);
  const [, version, major, minor, patch, prerelease] = match;

  const versionObject = {
    version,
    major,
    minor,
    patch,
    prerelease,
  };

  validateVersion(versionObject, buildType);

  return versionObject;
}

function validateBuildType(buildType) {
  const validBuildTypes = new Set([
    'release',
    'dry-run',
    'nightly',
    'prealpha',
  ]);
  if (!validBuildTypes.has(buildType)) {
    throw new Error(`Unsupported build type: ${buildType}`);
  }
}

function extractMatchIfValid(versionStr) {
  const match = versionStr.match(VERSION_REGEX);
  if (!match) {
    throw new Error(
      `You must pass a correctly formatted version; couldn't parse ${versionStr}`,
    );
  }
  return match;
}

function validateVersion(versionObject, buildType) {
  const map = {
    release: validateRelease,
    'dry-run': validateDryRun,
    nightly: validateNightly,
    prealpha: validatePrealpha,
  };

  const validationFunction = map[buildType];
  validationFunction(versionObject);
}

/**
 * Releases are in the form of 0.Y.Z[-RC.0]
 */
function validateRelease(version) {
  const validRelease = isStableRelease(version) || isStablePrerelease(version);
  if (!validRelease) {
    throw new Error(`Version ${version.version} is not valid for Release`);
  }
}

function validateDryRun(version) {
  if (
    !isMain(version) &&
    !isNightly(version) &&
    !isStableRelease(version) &&
    !isStablePrerelease(version)
  ) {
    throw new Error(`Version ${version.version} is not valid for dry-runs`);
  }
}

function validateNightly(version) {
  // a valid nightly is a prerelease
  if (!isNightly(version)) {
    throw new Error(`Version ${version.version} is not valid for nightlies`);
  }
}

function validatePrealpha(version) {
  if (!isValidPrealpha(version)) {
    throw new Error(`Version ${version.version} is not valid for prealphas`);
  }
}

function isStableRelease(version) {
  return (
    version.major === '0' && version.minor !== '0' && version.prerelease == null
  );
}

function isStablePrerelease(version) {
  return (
    version.major === '0' &&
    version.minor !== '0' &&
    version.patch.match(/^\d+$/) &&
    version.prerelease != null &&
    (version.prerelease.startsWith('rc.') ||
      version.prerelease.startsWith('rc-') ||
      version.prerelease.match(/^(\d{8})-(\d{4})$/))
  );
}

function isNightly(version) {
  // Check if older nightly version
  if (version.major === '0' && version.minor === '0' && version.patch === '0') {
    return true;
  }

  return version.version.includes('nightly');
}

function isMain(version) {
  return (
    version.major === '1000' && version.minor === '0' && version.patch === '0'
  );
}

function isReleaseBranch(branch) {
  return branch.endsWith('-stable');
}

function isValidPrealpha(version) {
  return (
    version.major === '0' &&
    version.minor === '0' &&
    version.patch === '0' &&
    version.prerelease != null &&
    version.prerelease.match(/^prealpha-(\d{10})$/)
  );
}

module.exports = {
  validateBuildType,
  parseVersion,
  isNightly,
  isReleaseBranch,
  isMain,
  isStableRelease,
  isStablePrerelease,
};
