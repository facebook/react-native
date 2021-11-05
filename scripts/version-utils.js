/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    throw new Error(
      `You must pass a correctly formatted version; couldn't parse ${version}`,
    );
  }
  const [, major, minor, patch, prerelease] = match;
  return {
    major,
    minor,
    patch,
    prerelease,
  };
}

module.exports = {
  parseVersion,
};
