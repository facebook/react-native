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
  dangerouslyResignGeneratedFile,
  processDotSlashFileInPlace,
  validateAndParseDotSlashFile,
  validateDotSlashArtifactData,
} = require('./utils/dotslash-utils');
const path = require('path');
const {parseArgs, styleText} = require('util');

const FIRST_PARTY_DOTSLASH_FILES = [
  'packages/debugger-shell/bin/react-native-devtools',
];

const config = {
  allowPositionals: true,
  options: {
    help: {type: 'boolean'},
  },
};

async function main() {
  const {
    positionals: [version],
    values: {help},
    /* $FlowFixMe[incompatible-call] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/releases/write-dotslash-release-asset-urls.js <version>

  Inserts references to release assets URLs into first-party DotSlash files in
  the repo, in preparation for publishing a new release and uploading the
  assets (which happens in a separate step).
`);
    return;
  }

  if (version == null) {
    throw new Error('Missing version argument');
  }

  await writeReleaseAssetUrlsToDotSlashFiles(version);
}

async function writeReleaseAssetUrlsToDotSlashFiles(
  version /*: string */,
) /*: Promise<void> */ {
  const releaseTag = `v${version}`;
  for (const filename of FIRST_PARTY_DOTSLASH_FILES) {
    const fullPath = path.join(REPO_ROOT, filename);
    console.log(`Updating ${filename}...`);
    const upstreamProviderValidationPromises = [];
    await processDotSlashFileInPlace(
      fullPath,
      (providers, suggestedFilename, artifactInfo) => {
        let upstreamHttpProvidersCount = 0;
        const mutProviders = providers.filter(provider => {
          if (provider.type === 'http' || provider.type == null) {
            if (
              // Remove any existing release asset URLs
              provider.url.startsWith(
                'https://github.com/facebook/react-native/releases/download/',
              )
            ) {
              console.log(styleText('red', `  -${provider.url}`));
              return false;
            }
            console.log(styleText('dim', `   ${provider.url}`));
            upstreamProviderValidationPromises.push(
              (async () => {
                console.log(
                  `Downloading from ${provider.url} for integrity validation...`,
                );
                const {data} = await getWithCurl(provider.url);
                await validateDotSlashArtifactData(data, artifactInfo);
              })(),
            );
            ++upstreamHttpProvidersCount;
            return true;
          }
          // Keep all other providers, though we can't validate them nor use them
          // in upload-release-assets-for-dotslash.
          console.log(
            styleText('dim', `   <provider of type: ${provider.type}>`),
          );
          return true;
        });
        if (upstreamHttpProvidersCount === 0) {
          throw new Error(
            'No upstream HTTP providers found for asset:' +
            suggestedFilename,
          );
        }
        const url = `https://github.com/facebook/react-native/releases/download/${encodeURIComponent(releaseTag)}/${encodeURIComponent(suggestedFilename)}`;
        console.log(styleText('green', `  +${url}`));
        mutProviders.unshift({
          url,
        });
        console.log('\n');
        return mutProviders;
      },
    );
    await Promise.all(upstreamProviderValidationPromises);
    await dangerouslyResignGeneratedFile(fullPath);
    await validateAndParseDotSlashFile(fullPath);
  }
}

module.exports = {
  FIRST_PARTY_DOTSLASH_FILES,
  writeReleaseAssetUrlsToDotSlashFiles,
};

if (require.main === module) {
  void main();
}
