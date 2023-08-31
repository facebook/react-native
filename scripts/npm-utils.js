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
const {parseVersion} = require('./version-utils');
const {
  exitIfNotOnGit,
  getCurrentCommit,
  isTaggedLatest,
} = require('./scm-utils');

// Get `next` version from npm and +1 on the minor for `main` version
function getMainVersion() {
  const versionStr = getPackageVersionStrByTag('react-native', 'next');
  const {major, minor} = parseVersion(versionStr, 'release');
  return `${major}.${parseInt(minor, 10) + 1}.0`;
}

function getNpmInfo(buildType) {
  const currentCommit = getCurrentCommit();
  const shortCommit = currentCommit.slice(0, 9);

  if (buildType === 'dry-run') {
    return {
      version: `1000.0.0-${shortCommit}`,
      tag: null, // We never end up publishing this
    };
  }

  if (buildType === 'nightly') {
    const mainVersion = getMainVersion();
    const dateIdentifier = new Date()
      .toISOString()
      .slice(0, -14)
      .replace(/[-]/g, '');
    return {
      version: `${mainVersion}-nightly-${dateIdentifier}-${shortCommit}`,
      tag: 'nightly',
    };
  }

  const {version, major, minor, prerelease} = parseVersion(
    process.env.CIRCLE_TAG,
    buildType,
  );

  // See if releaser indicated that this version should be tagged "latest"
  // Set in `trigger-react-native-release`
  const isLatest = exitIfNotOnGit(
    () => isTaggedLatest(currentCommit),
    'Not in git. We do not want to publish anything',
  );

  const releaseBranchTag = `${major}.${minor}-stable`;

  // npm will automatically tag the version as `latest` if no tag is set when we publish
  // To prevent this, use `releaseBranchTag` when we don't want that (ex. releasing a patch on older release)
  const tag =
    prerelease != null ? 'next' : isLatest ? 'latest' : releaseBranchTag;

  return {
    version,
    tag,
  };
}

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
  getNpmInfo,
  getPackageVersionStrByTag,
  publishPackage,
  diffPackages,
  pack,
};
