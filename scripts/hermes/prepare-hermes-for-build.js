/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script prepares Hermes to be built as part of the
 * iOS build pipeline on macOS.
 */
const {
  configureMakeForPrebuiltHermesC,
  copyBuildScripts,
  copyPodSpec,
  downloadHermesTarball,
  expandHermesTarball,
  shouldUsePrebuiltHermesC,
  shouldBuildHermesFromSource,
} = require('./hermes-utils');

async function main(pullRequest) {
  if (!shouldBuildHermesFromSource(pullRequest)) {
    copyPodSpec();
    return;
  }

  downloadHermesTarball();
  expandHermesTarball();
  copyPodSpec();
  copyBuildScripts();

  if (shouldUsePrebuiltHermesC('macos')) {
    console.log('[Hermes] Using pre-built HermesC');
    configureMakeForPrebuiltHermesC();
  }
}

const pullRequest = process.argv.length > 2 ? process.argv[2] : null;
console.log(`Pull request detected: ${pullRequest}`);
main(pullRequest).then(() => {
  process.exit(0);
});
