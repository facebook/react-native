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
  if (issue.labels.find(label => label.name == 'Type: Upgrade Issue')) {
    return;
  }

  // Extract RN version number from the issue body, if it exists
  const getReactNativeVersionIfExists = issue => {
    if (!issue || !issue.body) return;
    const rnVersionRegex =
      /React Native Version[\r\n]+[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,2}/;
    const rnVersionMatch = issue.body.match(rnVersionRegex);
    if (!rnVersionMatch || !rnVersionMatch[0]) return;
    return rnVersionMatch[0];
  };
  const issueVersion = parseVersionFromString(
    getReactNativeVersionIfExists(issue),
  );

  if (!issueVersion) {
    return 'Needs: Version Info';
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

  if (!isVersionSupported(issueVersion, latestVersion, recentReleases)) {
    return 'Needs: Verify on Latest Version';
  }
};

// We support N-2 minor versions. We also want to match the highest available patch for the given minor.
// E.g. the latest release is 0.71.2. 0.71.0 -> Please upgrade. 0.69.8 -> OK. 0.69.7 -> Please upgrade.
// releaseNames is expected to be an array sorted in the order of release recency.
function isVersionSupported(actualVersion, latestVersion, releaseNames) {
  // Assumes that releases are sorted in the order of recency (i.e. most recent releases are earlier in the list)
  // This enables us to stop looking as soon as we find the first release with a matching major/minor version, since
  // we know it's the most recent release, therefore the highest patch available.
  const getLatestPatchForVersion = (version, releases) => {
    for (releaseName of releases) {
      const release = parseVersionFromString(releaseName);
      if (release.major == version.major && release.minor == version.minor) {
        return release.patch;
      }
    }
  };

  // Very old version; user should upgrade to latest
  if (
    actualVersion.major != latestVersion.major ||
    actualVersion.minor < latestVersion.minor - 2
  ) {
    return false;
  }

  // Supported minor, verify that the patch is also supported
  // For now, we treat all prerelease versions as supported as long as they are on the same patch
  const latestPatchForVersion = getLatestPatchForVersion(
    actualVersion,
    releaseNames,
  );
  return actualVersion.patch == latestPatchForVersion;
}

function parseVersionFromString(version) {
  if (!version) return;
  // This will match the standard x.x.x semver format, as well as the non-standard prerelease x.x.x-rc.x
  const semverRegex =
    /(?<major>[0-9]{1,2})\.(?<minor>[0-9]{1,2})\.(?<patch>[0-9]{1,2})(-[rR]{1}[cC]{1}\.(?<prerelease>[0-9]{1,2}))?/;
  const versionMatch = version.match(semverRegex);
  const {major, minor, patch, prerelease} = versionMatch.groups;
  return {
    major: parseInt(major),
    minor: parseInt(minor),
    patch: parseInt(patch),
    prerelease: parseInt(prerelease),
  };
}
