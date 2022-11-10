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
 */
function parseVersion(versionStr, buildType) {
  validateBuildType(buildType);

  const match = _extractMatchIfValid(versionStr);
  const [, version, major, minor, patch, prerelease] = match;

  const versionObject = {
    version,
    major,
    minor,
    patch,
    prerelease,
  };

  _validateVersion(versionObject, buildType);

  return versionObject;
}

function validateBuildType(buildType) {
  if (['release', 'dry-run', 'nightly'].indexOf(buildType) < 0) {
    throw new Error(`Unsupported build type: ${buildType}`);
  }
}

function _extractMatchIfValid(versionStr) {
  const match = versionStr.match(VERSION_REGEX);
  if (!match) {
    throw new Error(
      `You must pass a correctly formatted version; couldn't parse ${versionStr}`,
    );
  }
  return match;
}

function _validateVersion(versionObject, buildType) {
  const map = {
    release: _validateRelease,
    'dry-run': _validateDryRun,
    nightly: _validateNightly,
  };
  map[buildType](versionObject);
}

/**
 * Releases are in the form of 0.Y.Z[-RC.0]
 */
function _validateRelease(version) {
  const validRelease =
    _isStableRelease(version) || _isStablePrerelease(version);
  if (!validRelease) {
    throw new Error(`Version ${version.version} is not valid for Release`);
  }
}

function _validateDryRun(version) {
  const isMain = _isMain(version);
  const isNightly = _is000(version) && version.prerelease != null;
  const isRelease = _isStableRelease(version);
  const isPrerelease = _isStablePrerelease(version);

  if (!isMain && !isNightly && !isRelease && !isPrerelease) {
    throw new Error(`Version ${version.version} is not valid for dry-runs`);
  }
}

function _validateNightly(version) {
  // a valid nightly is a prerelease
  const isPrerelease = version.prerelease != null;
  const isValidNightly = _is000(version) && isPrerelease;
  if (!isValidNightly) {
    throw new Error(`Version ${version.version} is not valid for nightlies`);
  }
}

function _isStableRelease(version) {
  return (
    version.major === '0' && version.minor !== '0' && version.prerelease == null
  );
}

function _isStablePrerelease(version) {
  return (
    version.major === '0' &&
    version.minor !== '0' &&
    version.prerelease != null &&
    (version.prerelease.startsWith('rc.') ||
      version.prerelease.startsWith('rc-'))
  );
}

function _is000(version) {
  return (
    version.major === '0' && version.minor === '0' && version.patch === '0'
  );
}

function _isMain(version) {
  return (
    version.major === '1000' && version.minor === '0' && version.patch === '0'
  );
}

function isReleaseBranch(branch) {
  return branch.endsWith('-stable');
}

module.exports = {
  validateBuildType,
  parseVersion,
  isReleaseBranch,
};
