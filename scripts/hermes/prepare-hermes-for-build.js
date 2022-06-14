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

async function main() {
  if (!shouldBuildHermesFromSource()) {
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

main().then(() => {
  process.exit(0);
});
