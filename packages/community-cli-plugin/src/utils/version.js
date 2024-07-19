/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import {logger} from './logger';
import chalk from 'chalk';
import {readFileSync} from 'fs';
import path from 'path';
import semver from 'semver';

type Release = {
  // The current stable release
  stable: string,
  // The current candidate release. These are only populated if the latest release is a candidate release.
  candidate?: string,
  changelogUrl: string,
  diffUrl: string,
};

interface DiffPurge {
  name: string;
  zipball_url: string;
  tarball_url: string;
  commit: {
    sha: string,
    url: string,
  };
  node_id: string;
}

type Update = {
  // Only populated if an upgrade is available
  upgrade?: Release,
  // The project's package's current version
  current: string,
  // The project's package's name
  name: string,
};

type LatestVersions = {
  candidate?: string,
  stable: string,
};

type Headers = {
  'User-Agent': string,
  [header: string]: string,
};

function getReactNativeVersion(projectRoot: string): string | void {
  try {
    const resolvedPath: string = require.resolve('react-native/package.json', {
      paths: [projectRoot],
    });
    logger.debug(
      `Found 'react-native' from '${projectRoot}' -> '${resolvedPath}'`,
    );
    return JSON.parse(readFileSync(resolvedPath, 'utf8')).version;
  } catch {
    logger.debug("Couldn't read the version of 'react-native'");
    return;
  }
}

/**
 * Logs out a message if the user's version is behind a stable version of React Native
 */
export async function logIfUpdateAvailable(projectRoot: string): Promise<void> {
  const versions = await latest(projectRoot);
  if (!versions?.upgrade) {
    return;
  }
  if (semver.gt(versions.upgrade.stable, versions.current)) {
    logger.info(
      `React Native v${versions.upgrade.stable} is now available (your project is running on v${versions.name}).
Changelog: ${chalk.dim.underline(versions.upgrade?.changelogUrl ?? 'none')}
Diff: ${chalk.dim.underline(versions.upgrade?.diffUrl ?? 'none')}
`,
    );
  }
}

/**
 * Finds the latest stables version of React Native > current version
 */
async function latest(projectRoot: string): Promise<Update | void> {
  try {
    const currentVersion = getReactNativeVersion(projectRoot);
    if (currentVersion == null) {
      return;
    }
    const {name} = JSON.parse(
      readFileSync(path.join(projectRoot, 'package.json'), 'utf8'),
    );
    const upgrade = await getLatestRelease(name, currentVersion);

    if (upgrade) {
      return {
        name,
        current: currentVersion,
        upgrade,
      };
    }
  } catch (e) {
    // We let the flow continue as this component is not vital for the rest of
    // the CLI.
    logger.debug(
      'Cannot detect current version of React Native, ' +
        'skipping check for a newer release',
    );
    logger.debug(e);
  }
}

// $FlowFixMe
function isDiffPurgeEntry(data: Partial<DiffPurge>): data is DiffPurge {
  return (
    [data.name, data.zipball_url, data.tarball_url, data.node_id].filter(
      e => typeof e !== 'undefined',
    ).length === 0
  );
}

/**
 * Checks via GitHub API if there is a newer stable React Native release and,
 * if it exists, returns the release data.
 *
 * If the latest release is not newer or if it's a prerelease, the function
 * will return undefined.
 */
export default async function getLatestRelease(
  name: string,
  currentVersion: string,
): Promise<Release | void> {
  logger.debug('Checking for a newer version of React Native');
  try {
    logger.debug(`Current version: ${currentVersion}`);

    // if the version is a nightly/canary build, we want to bail
    // since they are nightlies or unreleased versions
    if (['-canary', '-nightly'].some(s => currentVersion.includes(s))) {
      return;
    }

    logger.debug('Checking for newer releases on GitHub');
    const latestVersion = await getLatestRnDiffPurgeVersion(name);
    if (latestVersion == null) {
      logger.debug('Failed to get latest release');
      return;
    }
    const {stable, candidate} = latestVersion;
    logger.debug(`Latest release: ${stable} (${candidate ?? ''})`);

    if (semver.compare(stable, currentVersion) >= 0) {
      return {
        stable,
        candidate,
        changelogUrl: buildChangelogUrl(stable),
        diffUrl: buildDiffUrl(currentVersion, stable),
      };
    }
  } catch (e) {
    logger.debug(
      'Something went wrong with remote version checking, moving on',
    );
    logger.debug(e);
  }
}

function buildChangelogUrl(version: string) {
  return `https://github.com/facebook/react-native/releases/tag/v${version}`;
}

function buildDiffUrl(oldVersion: string, newVersion: string) {
  return `https://react-native-community.github.io/upgrade-helper/?from=${oldVersion}&to=${newVersion}`;
}

/**
 * Returns the most recent React Native version available to upgrade to.
 */
async function getLatestRnDiffPurgeVersion(
  name: string,
): Promise<LatestVersions | void> {
  const options = {
    // https://developer.github.com/v3/#user-agent-required
    headers: {'User-Agent': '@react-native/community-cli-plugin'} as Headers,
  };

  const resp = await fetch(
    'https://api.github.com/repos/react-native-community/rn-diff-purge/tags',
    options,
  );

  const result: LatestVersions = {stable: '0.0.0'};

  if (resp.status !== 200) {
    return;
  }

  const body: DiffPurge[] = (await resp.json()).filter(isDiffPurgeEntry);
  for (const {name: version} of body) {
    if (result.candidate != null && version.includes('-rc')) {
      result.candidate = version.substring(8);
      continue;
    }
    if (!version.includes('-rc')) {
      result.stable = version.substring(8);
      return result;
    }
  }
  return result;
}
