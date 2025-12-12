/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HermesVariant, SyncCommandResult} from '../utils';

import {isCI} from '../EnvironmentOptions';
import {NATIVE_BUILD_OUTPUT_PATH} from '../paths';
import {
  getBuckModesForPlatform,
  getBuckOptionsForHermes,
  getConfigForAnimationBackend,
  getDebugInfoFromCommandResult,
  getHermesCompilerTarget,
  runBuck2Sync,
  runCommandSync,
} from '../utils';
import fs from 'fs';
import path from 'path';

type HermescOptions = $ReadOnly<{
  enableCoverage: boolean,
  enableRelease: boolean,
  hermesVariant: HermesVariant,
}>;

function getHermescPath({
  enableRelease,
  hermesVariant,
}: HermescOptions): string {
  return path.join(
    NATIVE_BUILD_OUTPUT_PATH,
    `hermesc-${(hermesVariant as string).toLowerCase()}-${enableRelease ? 'opt' : 'dev'}`,
  );
}
export function build(options: HermescOptions): void {
  const destPath = getHermescPath(options);
  if (fs.existsSync(destPath)) {
    return;
  }

  const tmpPath = destPath + '-' + Date.now();

  try {
    const result = runBuck2Sync([
      'build',
      ...getBuckModesForPlatform({
        enableRelease: options.enableRelease,
        enableCoverage: options.enableCoverage,
      }),
      ...getBuckOptionsForHermes(options.hermesVariant),
      ...getConfigForAnimationBackend(),
      getHermesCompilerTarget(options.hermesVariant),
      '--out',
      tmpPath,
    ]);

    if (result.status !== 0) {
      throw new Error(getDebugInfoFromCommandResult(result));
    }

    if (fs.existsSync(destPath)) {
      // Another test might have compiled the binary after our initial check.
      return;
    }

    fs.renameSync(tmpPath, destPath);
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {}
  }
}

export function run(
  args: $ReadOnlyArray<string>,
  options: HermescOptions,
): SyncCommandResult {
  if (!isCI) {
    build(options);
  }

  return runCommandSync(getHermescPath(options), args);
}
