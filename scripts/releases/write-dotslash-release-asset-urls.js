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

const {
  dangerouslyResignGeneratedFile,
  processDotSlashFileInPlace,
  validateAndParseDotSlashFile,
} = require('./utils/dotslash-utils');
const {REPO_ROOT} = require('../shared/consts');
const {parseArgs, styleText} = require('util');
const path = require('path');

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
    await processDotSlashFileInPlace(
      fullPath,
      (providers, suggestedFilename) => {
        providers = providers.filter(provider => {
          // Remove any existing release asset URLs
          if (
            (provider.type === 'http' || provider.type == null) &&
            provider.url.startsWith(
              'https://github.com/facebook/react-native/releases/download/',
            )
          ) {
            console.log(styleText('red', `  -${provider.url}`));
            return false;
          }
          console.log(styleText('dim', `   ${provider.url}`));
          return true;
        });
        if (providers.length === 0) {
          throw new Error(
            'No usable providers found for asset:',
            suggestedFilename,
          );
        }
        const url = `https://github.com/facebook/react-native/releases/download/${encodeURIComponent(releaseTag)}/${encodeURIComponent(suggestedFilename)}`;
        console.log(styleText('green', `  +${url}`));
        providers.unshift({
          url,
        });
        console.log('\n');
        return providers;
      },
    );
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
