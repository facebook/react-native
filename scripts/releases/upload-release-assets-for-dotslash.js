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

const {REPO_ROOT} = require('../shared/consts');
const {getWithCurl} = require('./utils/curl-utils');
const {
  processDotSlashFileInPlace,
  validateDotSlashArtifactData,
} = require('./utils/dotslash-utils');
const {
  FIRST_PARTY_DOTSLASH_FILES,
} = require('./write-dotslash-release-asset-urls');
// $FlowFixMe[untyped-import] TODO: add types for @octokit/rest
const {Octokit} = require('@octokit/rest');
const nullthrows = require('nullthrows');
const path = require('path');
const {parseArgs} = require('util');

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
  {version: versionArg, token, releaseId, force = false, dryRun = false} /*: {
    version: string,
    token: string,
    releaseId: string,
    force?: boolean,
    dryRun?: boolean,
  } */,
) /*: Promise<void> */ {
  let version = versionArg;
  if (version.startsWith('v')) {
    version = version.substring(1);
  }

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
        // NOTE: We mostly ignore suggestedFilename in favour of reading the actual asset URLs
        suggestedFilename,
        artifactInfo,
      ) => {
        let upstreamUrl, targetReleaseAssetInfo;
        for (const provider of providers) {
          if (provider.type != null && provider.type !== 'http') {
            console.log(
              'Skipping non-HTTP provider: ' + JSON.stringify(provider),
            );
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
          console.log(
            `[${suggestedFilename} (suggested)] No provider URLs matched release asset prefix: ${releaseAssetPrefix}`,
          );
          return;
        }
        if (upstreamUrl == null) {
          throw new Error(
            `No upstream URL found for release asset ${targetReleaseAssetInfo.name}`,
          );
        }
        uploadPromises.push(
          (async () => {
            const existingAsset = existingAssetsByName.get(
              targetReleaseAssetInfo.name,
            );
            if (!existingAsset) {
              return;
            }
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
                asset_id: existingAsset.id,
              });
            }
            console.log(
              `[${targetReleaseAssetInfo.name}] Downloading from ${upstreamUrl}...`,
            );
            // NOTE: Using curl because we have seen issues with fetch() on GHA
            // and the Meta CDN. ¯\_(ツ)_/¯
            const {data, headers} = await getWithCurl(upstreamUrl);
            console.log(
              `[${targetReleaseAssetInfo.name}] Validating download...`,
            );
            await validateDotSlashArtifactData(data, artifactInfo);
            if (dryRun) {
              console.log(
                `[${targetReleaseAssetInfo.name}] Dry run: Not uploading to release.`,
              );
              return;
            } else {
              console.log(
                `[${targetReleaseAssetInfo.name}] Uploading to release...`,
              );
              const {
                data: {browser_download_url},
              } = await octokit.repos.uploadReleaseAsset({
                owner: 'facebook',
                repo: 'react-native',
                release_id: releaseId,
                name: targetReleaseAssetInfo.name,
                data,
                headers: {
                  'content-type':
                    headers['content-type'] ?? 'application/octet-stream',
                },
              });
              const actualUrlPathname = new URL(browser_download_url).pathname;
              const actualAssetName = decodeURIComponent(
                nullthrows(/[^/]*$/.exec(actualUrlPathname))[0],
              );
              if (actualAssetName !== targetReleaseAssetInfo.name) {
                throw new Error(
                  `Asset name was changed while uploading to the draft release: expected ${targetReleaseAssetInfo.name}, got ${actualAssetName}. ` +
                    `${filename} has already been published with the following URL, which will not work when the release is published: ${targetReleaseAssetInfo.url}`,
                );
              }
              console.log(
                `[${targetReleaseAssetInfo.name}] Uploaded to ${browser_download_url}`,
              );
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
