/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {exec} = require('shelljs');

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

function getBranchName() {
  return exec('git rev-parse --abbrev-ref HEAD', {
    silent: true,
  }).stdout.trim();
}

function getPublishVersion(tag) {
  if (!tag.startsWith('publish-')) {
    return null;
  }

  const versionStr = tag.replace('publish-', '');
  return parseVersion(versionStr);
}

function isTaggedLatest(commitSha) {
  return (
    exec(`git rev-list -1 latest | grep ${commitSha}`, {
      silent: true,
    }).stdout.trim() === commitSha
  );
}

function getPublishTag() {
  // Assumes we only ever have one tag with the prefix `publish-v`
  const tag = exec("git tag --points-at HEAD | grep 'publish-v'", {
    silent: true,
  }).stdout.trim();
  return tag ? tag : null;
}

module.exports = {
  getBranchName,
  isTaggedLatest,
  getPublishTag,
  getPublishVersion,
  parseVersion,
  isReleaseBranch,
};
