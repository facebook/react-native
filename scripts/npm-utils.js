/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {exec} = require('shelljs');

function getPackageVersionStrByTag(packageName, tag) {
  const result = exec(`npm view ${packageName}@${tag} version`);

  if (result.code) {
    throw `Failed to get ${tag} version from npm\n${result.stderr}`;
  }
  return result.stdout.trim();
}

function publishPackage(packagePath, packageOptions, execOptions) {
  const {tag, otp} = packageOptions;
  const tagFlag = tag ? ` --tag ${tag}` : '';
  const otpFlag = otp ? ` --otp ${otp}` : '';
  const options = execOptions
    ? {...execOptions, cwd: packagePath}
    : {cwd: packagePath};

  return exec(`npm publish${tagFlag}${otpFlag}`, options);
}

module.exports = {
  getPackageVersionStrByTag,
  publishPackage,
};
