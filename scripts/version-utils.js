/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {exec} = require('shelljs');

function parseVersion(versionStr) {
  const match = versionStr.match(/^v?((\d+)\.(\d+)\.(\d+)(?:-(.+))?)$/);
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

function getLatestVersionTag(branchVersion) {
  // Returns list of tags like ["v0.67.2", "v0.67.1", "v0.67.0-rc.3", "v0.67.0-rc.2", ...] in reverse lexical order
  const tags = exec(`git tag --list "v${branchVersion}*" --sort=-refname`, {
    silent: true,
  })
    .stdout.trim()
    .split('\n')
    .filter(tag => tag.length > 0);

  // If there are no tags, return null
  if (tags.length === 0) {
    return null;
  }

  // Return most recent tag (with the "v" prefix)
  return tags[0];
}

function getNextVersionFromTags(branch) {
  // Assumption that branch names will follow pattern `{major}.{minor}-stable`
  // Ex. "0.67-stable" -> "0.67"
  const branchVersion = branch.replace('-stable', '');

  // Get the latest version tag of the release branch
  const versionTag = getLatestVersionTag(branchVersion);

  // If there are no tags , we assume this is the first pre-release
  if (versionTag == null) {
    return `${branchVersion}.0-rc.0`;
  }

  const {major, minor, patch, prerelease} = parseVersion(versionTag);
  if (prerelease != null) {
    // prelease is of the form "rc.X"
    const prereleasePatch = parseInt(prerelease.slice(3), 10);
    return `${major}.${minor}.${patch}-rc.${prereleasePatch + 1}`;
  }

  // If not prerelease, increment the patch version
  return `${major}.${minor}.${parseInt(patch, 10) + 1}`;
}

module.exports = {
  parseVersion,
  getNextVersionFromTags,
};
