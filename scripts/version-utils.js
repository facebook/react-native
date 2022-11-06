/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

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

  module.exports = {
    parseVersion,
  };