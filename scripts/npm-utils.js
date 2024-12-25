/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {parseVersion} = require('./releases/utils/version-utils');
const {
  exitIfNotOnGit,
  getCurrentCommit,
  isTaggedLatest,
} = require('./scm-utils');
const {exec} = require('shelljs');

/*::
import type { ExecOptsSync, ShellString } from 'shelljs';

type BuildType = 'dry-run' | 'release' | 'nightly' | 'prealpha';
type NpmInfo = {
  version: string,
  tag: ?string,
}
type PackageJSON = {
  name: string,
  version: string,
  dependencies: {[string]: string},
  devDependencies: {[string]: string},
  ...
}
type NpmPackageOptions = {
  tags: ?Array<string> | ?Array<?string>,
  otp: ?string,
  access?: ?('public' | 'restricted')
}
*/

// Get `next` version from npm and +1 on the minor for `main` version
function getMainVersion() {
  const versionStr = getPackageVersionStrByTag('react-native', 'next');
  const {major, minor} = parseVersion(versionStr, 'release');
  return `${major}.${parseInt(minor, 10) + 1}.0`;
}

function getNpmInfo(buildType /*: BuildType */) /*: NpmInfo */ {
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

  if (buildType === 'prealpha') {
    const mainVersion = '0.0.0';
    // Date in the format of YYYYMMDDHH.
    // This is a progressive int that can track subsequent
    // releases and it is smaller of 2^32-1.
    // It is unlikely that we can trigger two prealpha in less
    // than an hour given that nightlies take ~ 1 hr to complete.
    const dateIdentifier = new Date()
      .toISOString()
      .slice(0, -10)
      .replace(/[-T:]/g, '');

    return {
      version: `${mainVersion}-prealpha-${dateIdentifier}`,
      tag: 'prealpha',
    };
  }

  if (buildType === 'release') {
    let versionTag /*: string*/ = '';
    if (process.env.CIRCLE_TAG != null && process.env.CIRCLE_TAG !== '') {
      versionTag = process.env.CIRCLE_TAG;
    } else if (
      process.env.GITHUB_REF != null &&
      process.env.GITHUB_REF.includes('/tags/') &&
      process.env.GITHUB_REF_NAME != null &&
      process.env.GITHUB_REF_NAME !== ''
    ) {
      // GITHUB_REF contains the fully qualified ref, for example refs/tags/v0.75.0-rc.0
      // GITHUB_REF_NAME contains the short name, for example v0.75.0-rc.0
      versionTag = process.env.GITHUB_REF_NAME;
    }

    if (versionTag === '') {
      throw new Error(
        'No version tag found in CI. It looks like this script is running in release mode, but the CIRCLE_TAG or the GITHUB_REF_NAME are missing.',
      );
    }

    const {version, major, minor, patch, prerelease} = parseVersion(
      versionTag,
      buildType,
    );

    // See if releaser indicated that this version should be tagged "latest"
    // Set in `trigger-react-native-release`
    const isLatest = exitIfNotOnGit(
      () => isTaggedLatest(currentCommit),
      'Not in git. We do not want to publish anything',
    );

    const releaseBranchTag = `${major}.${minor}-stable`;
    let tag = releaseBranchTag;
    // npm will automatically tag the version as `latest` if no tag is set when we publish
    // To prevent this, use `releaseBranchTag` when we don't want that (ex. releasing a patch on older release)
    if (prerelease != null) {
      if (patch === '0') {
        // Set `next` tag only on prereleases of 0.m.0-RC.k.
        tag = 'next';
      } else {
        tag = '--no-tag';
      }
    } else if (isLatest === true) {
      tag = 'latest';
    }

    return {
      version,
      tag,
    };
  }

  throw new Error(`Unsupported build type: ${buildType}`);
}

function publishPackage(
  packagePath /*: string */,
  packageOptions /*: NpmPackageOptions */,
  execOptions /*: ?ExecOptsSync */,
) /*: ShellString */ {
  const {otp, tags, access} = packageOptions;

  let tagsFlag = '';
  if (tags != null) {
    tagsFlag = tags.includes('--no-tag')
      ? ' --no-tag'
      : tags
          .filter(Boolean)
          .map(t => ` --tag ${t}`)
          .join('');
  }

  const otpFlag = otp != null ? ` --otp ${otp}` : '';
  const accessFlag = access != null ? ` --access ${access}` : '';
  const options = execOptions
    ? {...execOptions, cwd: packagePath}
    : {cwd: packagePath};

  return exec(`npm publish${tagsFlag}${otpFlag}${accessFlag}`, options);
}

/**
 * `packageName`: name of npm package
 * `tag`: npm tag like `latest` or `next`
 *
 * This will fetch version of `packageName` with npm tag specified
 */
function getPackageVersionStrByTag(
  packageName /*: string */,
  tag /*: ?string */,
) /*: string */ {
  const npmString =
    tag != null
      ? `npm view ${packageName}@${tag} version`
      : `npm view ${packageName} version`;
  const result = exec(npmString, {silent: true});

  if (result.code) {
    throw new Error(`Failed to run '${npmString}'\n${result.stderr}`);
  }
  return result.stdout.trim();
}

/**
 * `packageName`: name of npm package
 * `spec`: spec range ex. '^0.72.0'
 *
 * Return an array of versions of the specified spec range or throw an error
 */
function getVersionsBySpec(
  packageName /*: string */,
  spec /*: string */,
) /*: Array<string> */ {
  const npmString = `npm view ${packageName}@'${spec}' version --json`;
  const result = exec(npmString, {silent: true});

  if (result.code) {
    // Special handling if no such package spec exists
    if (result.stderr.includes('npm ERR! code E404')) {
      /**
       * npm ERR! code E404
       * npm ERR! 404 No match found for version ^0.72.0
       * npm ERR! 404
       * npm ERR! 404  '@react-native/community-cli-plugin@^0.72.0' is not in this registry.
       * npm ERR! 404
       * npm ERR! 404 Note that you can also install from a
       * npm ERR! 404 tarball, folder, http url, or git url.
       * {
       *   "error": {
       *     "code": "E404",
       *     "summary": "No match found for version ^0.72.0",
       *     "detail": "\n '@react-native/community-cli-plugin@^0.72.0' is not in this registry.\n\nNote that you can also install from a\ntarball, folder, http url, or git url."
       *   }
       * }
       */
      const error = JSON.parse(
        result.stderr
          .split('\n')
          .filter(line => !line.includes('npm ERR'))
          .join(''),
      ).error;
      throw new Error(error.summary);
    } else {
      throw new Error(`Failed: ${npmString}`);
    }
  }
  const versions = JSON.parse(result.stdout.trim());
  return !Array.isArray(versions) ? [versions] : versions;
}

module.exports = {
  getNpmInfo,
  getVersionsBySpec,
  publishPackage,
};
