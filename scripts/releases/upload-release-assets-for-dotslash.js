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

const {validateAndParseDotSlashFile} = require('./utils/dotslash-utils');
const {REPO_ROOT} = require('../shared/consts');
const {parseArgs} = require('util');
const path = require('path');
const {Octokit} = require('@octokit/rest');
const {
  FIRST_PARTY_DOTSLASH_FILES,
} = require('./write-dotslash-release-asset-urls');

const config = {
  allowPositionals: true,
  options: {
    token: {type: 'string'},
    releaseId: {type: 'string'},
    force: {type: 'boolean', default: false},
    dryRun: {type: 'boolean', default: false},
    help: {type: 'boolean'},
  },
};

async function main() {
  const {
    positionals: [version],
    values: {help, token, releaseId, force, dryRun},
    /* $FlowFixMe[incompatible-call] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/releases/upload-release-assets-for-dotslash.js <version> --release_id <id> --token <github-token> [--force]

  Scans first-party DotSlash files in the repo for URLs referencing assets of
  an upcoming release, and uploads the actual assets to the GitHub release
  identified by the given release ID.

  If run with --force, the script will overwrite any assets that happen to
  already exist at the given URLs. This is useful for retrying failed or
  corrupted uploads.
`);
    return;
  }

  if (version == null) {
    throw new Error('Missing version argument');
  }

  await uploadReleaseAssetsForDotSlash({
    version,
    token,
    releaseId,
    force,
    dryRun,
  });
}

async function uploadReleaseAssetsForDotSlash(
  {version, token, releaseId, force = false, dryRun = false} /*: {
    version: string,
    token: string,
    releaseId: string,
    force?: boolean,
    dryRun?: boolean,
  } */,
) /*: Promise<void> */ {
  const releaseTag = `v${version}`;
  const releaseAssetPrefix = `https://github.com/facebook/react-native/releases/download/${encodeURIComponent(releaseTag)}/`;
  const octokit = new Octokit({auth: token});
  const existingAssets = await octokit.repos.listReleaseAssets({
    owner: 'facebook',
    repo: 'react-native',
    release_id: releaseId,
  });
  const existingAssetsByName = new Map(
    existingAssets.data.map(asset => [asset.name, asset]),
  );
  for (const filename of FIRST_PARTY_DOTSLASH_FILES) {
    const fullPath = path.join(REPO_ROOT, filename);
    console.log(`Uploading assets for ${filename}...`);
    const uploadPromises = [];
    await processDotSlashFileInPlace(
      fullPath,
      (
        providers,
        // Ignore _suggestedFilename in favour of reading the actual asset URLs
        _suggestedFilename,
      ) => {
        let upstreamUrl, targetReleaseAssetInfo;
        for (const provider of providers) {
          if (provider.type != null && provider.type !== 'http') {
            continue;
          }
          const url = provider.url;
          if (url.startsWith(releaseAssetPrefix)) {
            const name = decodeURIComponent(
              url.slice(releaseAssetPrefix.length),
            );
            targetReleaseAssetInfo = {name, url};
          } else {
            upstreamUrl = url;
          }
          if (upstreamUrl != null && targetReleaseAssetInfo != null) {
            break;
          }
        }
        if (targetReleaseAssetInfo == null) {
          // This DotSlash providers array does not reference any relevant release asset URLs, so we can ignore it.
          return;
        }
        if (upstreamUrl == null) {
          throw new Error(
            `No upstream URL found for release asset ${targetReleaseAssetInfo.name}`,
          );
        }
        uploadPromises.push(
          (async () => {
            if (existingAssetsByName.has(targetReleaseAssetInfo.name)) {
              if (!force) {
                console.log(
                  `[${targetReleaseAssetInfo.name}] Skipping existing release asset...`,
                );
                return;
              }
              if (dryRun) {
                console.log(
                  `[${targetReleaseAssetInfo.name}] Dry run: Not deleting existing release asset.`,
                );
              } else {
                console.log(
                  `[${targetReleaseAssetInfo.name}] Deleting existing release asset...`,
                );
                await octokit.repos.deleteReleaseAsset({
                  owner: 'facebook',
                  repo: 'react-native',
                  asset_id: existingAssetsByName.get(
                    targetReleaseAssetInfo.name,
                  ).id,
                });
              }
            }
            console.log(
              `[${targetReleaseAssetInfo.name}] Downloading from ${upstreamUrl}...`,
            );
            const response = await fetch(upstreamUrl);
            const data = await response.buffer();
            const contentType = response.headers.get('content-type');
            if (dryRun) {
              console.log(
                `[${targetReleaseAssetInfo.name}] Dry run: Not uploading to release.`,
              );
              return;
            } else {
              console.log(
                `[${targetReleaseAssetInfo.name}] Uploading to release...`,
              );
              await octokit.repos.uploadReleaseAsset({
                owner: 'facebook',
                repo: 'react-native',
                release_id: releaseId,
                name: targetReleaseAssetInfo.name,
                data,
                headers: {
                  'content-type': contentType,
                },
              });
            }
          })(),
        );
      },
    );
    await Promise.all(uploadPromises);
  }
}

module.exports = {
  uploadReleaseAssetsForDotSlash,
};

if (require.main === module) {
  void main();
}
