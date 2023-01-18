/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const VERSION_REGEX = /^v?((\d+)\.(\d+)\.(\d+)(?:-(.+))?)$/;

function parseVersion(versionStr) {
  const match = versionStr.match(VERSION_REGEX);
  if (!match) {
    throw new Error(
      `You must pass a correctly formatted version; couldn't parse ${versionStr}`,
    );
  }
  const [, version, major, minor, patch, prerelease] = match;
  return {
    version,
    major,
    minor,
    patch,
    prerelease,
  };
}

function isReleaseBranch(branch) {
  return branch.endsWith('-stable');
}

module.exports = {
  parseVersion,
  isReleaseBranch,
};
