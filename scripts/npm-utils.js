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
  const result = exec(`npm view ${packageName}@${tag} version`, {silent: true});

  if (result.code) {
    throw new Error(`Failed to get ${tag} version from npm\n${result.stderr}`);
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

function diffPackages(packageSpecA, packageSpecB, options) {
  const result = exec(
    `npm diff --diff=${packageSpecA} --diff=${packageSpecB} --diff-name-only`,
    options,
  );

  if (result.code) {
    throw new Error(
      `Failed to diff ${packageSpecA} and ${packageSpecB}\n${result.stderr}`,
    );
  }

  return result.stdout;
}

function pack(packagePath) {
  const result = exec('npm pack', {
    cwd: packagePath,
  });

  if (result.code !== 0) {
    throw new Error(result.stderr);
  }
}

/**
 * `package` is an object form of package.json
 * `dependencies` is a map of dependency to version string
 *
 * This replaces both dependencies and devDependencies in package.json
 */
function applyPackageVersions(originalPackageJson, packageVersions) {
  const packageJson = {...originalPackageJson};

  for (const name of Object.keys(packageVersions)) {
    if (
      packageJson.dependencies != null &&
      packageJson.dependencies[name] != null
    ) {
      packageJson.dependencies[name] = packageVersions[name];
    }

    if (
      packageJson.devDependencies != null &&
      packageJson.devDependencies[name] != null
    ) {
      packageJson.devDependencies[name] = packageVersions[name];
    }
  }
  return packageJson;
}

module.exports = {
  applyPackageVersions,
  getPackageVersionStrByTag,
  publishPackage,
  diffPackages,
  pack,
};
