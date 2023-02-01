/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * This script prepares Hermes to be built as part of the
 * iOS build pipeline on macOS.
 */
import {
  configureMakeForPrebuiltHermesC,
  copyBuildScripts,
  copyPodSpec,
  downloadHermesSourceTarball,
  expandHermesSourceTarball,
  shouldUsePrebuiltHermesC,
  shouldBuildHermesFromSource,
} from './hermes-utils';

function main(isInCI: boolean) {
  if (!shouldBuildHermesFromSource(isInCI)) {
    copyPodSpec();
    return;
  }

  downloadHermesSourceTarball();
  expandHermesSourceTarball();
  copyPodSpec();
  copyBuildScripts();

  if (shouldUsePrebuiltHermesC('macos')) {
    console.log('[Hermes] Using pre-built HermesC');
    configureMakeForPrebuiltHermesC();
  }
}

const isInCI = process.env.CI === 'true';

main(isInCI);
