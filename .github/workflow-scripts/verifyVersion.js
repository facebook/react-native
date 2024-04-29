/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

module.exports = async (github, context) => {
  const issue = context.payload.issue;

  // Ignore issues using upgrade template (they use a special label)
  if (issue.labels.find(label => label.name === 'Type: Upgrade Issue')) {
    return;
  }

  const issueVersionUnparsed =
    getReactNativeVersionFromIssueBodyIfExists(issue);
  const issueVersion = parseVersionFromString(issueVersionUnparsed);

  // Nightly versions are always supported
  if (reportedVersionIsNightly(issueVersionUnparsed, issueVersion)) return;

  if (!issueVersion) {
    return {label: 'Needs: Version Info'};
  }

  // Ensure the version matches one we support
  const recentReleases = (
    await github.rest.repos.listReleases({
      owner: context.repo.owner,
      repo: context.repo.repo,
    })
  ).data.map(release => release.name);

  const latestRelease = (
    await github.rest.repos.getLatestRelease({
      owner: context.repo.owner,
      repo: context.repo.repo,
    })
  ).data;
  const latestVersion = parseVersionFromString(latestRelease.name);

  // We want to "insta-close" an issue if RN version provided is too old. And encourage users to upgrade.
  if (isVersionTooOld(issueVersion, latestVersion)) {
    return {label: 'Type: Too Old Version'};
  }

  if (!isVersionSupported(issueVersion, latestVersion)) {
    return {label: 'Type: Unsupported Version'};
  }

  // We want to encourage users to repro the issue on the highest available patch for the given minor.
  const latestPatchForVersion = getLatestPatchForVersion(
    issueVersion,
    recentReleases,
  );
  if (latestPatchForVersion > issueVersion.patch) {
    return {
      label: 'Newer Patch Available',
      newestPatch: `${issueVersion.major}.${issueVersion.minor}.${latestPatchForVersion}`,
    };
  }
};

/**
 * Check if the RN version provided in an issue is supported.
 *
 * "We support `N-2` minor versions, and the `latest` major".
 */
function isVersionSupported(actualVersion, latestVersion) {
  return (
    actualVersion.major >= latestVersion.major &&
    actualVersion.minor >= latestVersion.minor - 2
  );
}

/**
 * Check if the RN version provided in an issue is too old.
 * "We support `N-2` minor versions, and the `latest` major".
 *
 * A RN version is *too old* if it's:
 * - `1` or more *major* behind the *latest major*.
 * - `5` or more *minor* behind the *latest minor* in the *same major*. Less aggressive.
 *   (e.g. If `0.72.0` is the current latest then `0.67.0` and lower is too old for `0.72.0`)
 */
function isVersionTooOld(actualVersion, latestVersion) {
  return (
    latestVersion.major - actualVersion.major >= 1 ||
    latestVersion.minor - actualVersion.minor >= 5
  );
}

// Assumes that releases are sorted in the order of recency (i.e. most recent releases are earlier in the list)
// This enables us to stop looking as soon as we find the first release with a matching major/minor version, since
// we know it's the most recent release, therefore the highest patch available.
function getLatestPatchForVersion(version, releases) {
  for (releaseName of releases) {
    const release = parseVersionFromString(releaseName);
    if (
      release &&
      release.major == version.major &&
      release.minor == version.minor
    ) {
      return release.patch;
    }
  }
}

function getReactNativeVersionFromIssueBodyIfExists(issue) {
  if (!issue || !issue.body) return;
  const rnVersionRegex = /React Native Version[\r\n]+(?<version>.+)[\r\n]*/;
  const rnVersionMatch = issue.body.match(rnVersionRegex);
  if (!rnVersionMatch || !rnVersionMatch.groups.version) return;
  return rnVersionMatch.groups.version;
}

function reportedVersionIsNightly(unparsedVersionString, version) {
  if (!unparsedVersionString && !version) return false;
  const nightlyRegex = /nightly/i;
  const nightlyMatch = unparsedVersionString.match(nightlyRegex);
  const versionIsNightly = nightlyMatch && nightlyMatch[0];

  const versionIsZero =
    version && version.major == 0 && version.minor == 0 && version.patch == 0;

  return versionIsZero || versionIsNightly;
}

function parseVersionFromString(version) {
  if (!version) return;
  // This will match the standard x.x.x semver format, as well as the non-standard prerelease x.x.x-rc.x
  const semverRegex =
    /(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(-[rR]{1}[cC]{1}\.(?<prerelease>\d+))?/;
  const versionMatch = version.match(semverRegex);
  if (!versionMatch) return;
  const {major, minor, patch, prerelease} = versionMatch.groups;
  return {
    major: parseInt(major),
    minor: parseInt(minor),
    patch: parseInt(patch),
    prerelease: parseInt(prerelease),
  };
}
