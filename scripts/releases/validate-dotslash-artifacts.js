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
const path = require('path');
const {parseArgs, styleText} = require('util');

const config = {
  allowPositionals: true,
  options: {
    help: {type: 'boolean'},
  },
};

async function main() {
  const {
    positionals: [],
    values: {help},
    /* $FlowFixMe[incompatible-call] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/releases/validate-dotslash-artifacts.js

  Ensures that the first-party DotSlash files in the current commit all point to
  valid URLs that return the described artifacts. This script is intended to run
  in two key scenarios:

  1. Continuously on main - this verifies the output of the Meta-internal CI pipeline
     that publishes DotSlash files to the repo.
  2. After a release is published - this verifies the behavior of the
     write-dotslash-release-asset-urls.js and upload-release-assets-for-dotslash.js
     scripts, as well as any commits (e.g. merges, picks) that touched the DotSlash
     files in the release branch since the branch was cut.
     Release asset URLs are only valid once the release is published, so we can't
     run this continuously on commits in the release branch (specifically, it would
     fail on the release commit itself).
`);
    return;
  }

  await validateDotSlashArtifacts();
}

async function validateDotSlashArtifacts() /*: Promise<void> */ {
  for (const filename of FIRST_PARTY_DOTSLASH_FILES) {
    const fullPath = path.join(REPO_ROOT, filename);
    console.log(`Validating all HTTP providers for ${filename}...`);
    const httpProviderValidationPromises = [];
    await processDotSlashFileInPlace(
      fullPath,
      (providers, suggestedFilename, artifactInfo) => {
        for (const provider of providers) {
          if (provider.type !== 'http' && provider.type != null) {
            console.log(
              styleText(
                'dim',
                `   <skipping provider of type: ${provider.type}>`,
              ),
            );
            continue;
          }
          httpProviderValidationPromises.push(
            (async () => {
              console.log(
                styleText(
                  'dim',
                  `   ${provider.url} (expected ${artifactInfo.size} bytes, ${artifactInfo.hash} ${artifactInfo.digest})`,
                ),
              );
              const {data} = await getWithCurl(provider.url);
              await validateDotSlashArtifactData(data, artifactInfo);
            })(),
          );
        }
        return providers;
      },
    );
    await Promise.all(httpProviderValidationPromises);
  }
}

module.exports = {
  validateDotSlashArtifacts,
};

if (require.main === module) {
  void main();
}
