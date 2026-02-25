/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AsyncCommandResult, HermesVariant} from '../utils';

import {debugCpp, isCI} from '../EnvironmentOptions';
import {NATIVE_BUILD_OUTPUT_PATH} from '../paths';
import {
  getBuckModesForPlatform,
  getBuckOptionsForHermes,
  getDebugInfoFromCommandResult,
  runBuck2,
  runBuck2Sync,
  runCommand,
  runCommandSync,
} from '../utils';
import fs from 'fs';
import os from 'os';
import path from 'path';

const FANTOM_TESTER_BUCK_TARGET =
  'fbsource//xplat/js/react-native-github/private/react-native-fantom/tester:tester';

type TesterOptions = Readonly<{
  isOptimizedMode: boolean,
  hermesVariant: HermesVariant,
}>;

function getFantomTesterPath({
  isOptimizedMode,
  hermesVariant,
}: TesterOptions): string {
  return path.join(
    NATIVE_BUILD_OUTPUT_PATH,
    `fantom-tester-${(hermesVariant as string).toLowerCase()}-${isOptimizedMode ? 'opt' : 'dev'}`,
  );
}

export function build(options: TesterOptions): void {
  const destPath = getFantomTesterPath(options);
  if (fs.existsSync(destPath)) {
    return;
  }

  // Use system temp directory outside the repo to avoid macOS extended
  // attribute issues with EdenFS/NFS-backed directories
  const tmpPath = path.join(
    os.tmpdir(),
    `fantom-tester-${Date.now()}-${process.pid}`,
  );
  const destTmpPath = destPath + '-' + Date.now() + '-' + process.pid;

  try {
    const result = runBuck2Sync([
      'build',
      ...getBuckModesForPlatform(options.isOptimizedMode),
      ...getBuckOptionsForHermes(options.hermesVariant),
      FANTOM_TESTER_BUCK_TARGET,
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

    // Remove extended attributes to avoid "Operation not permitted" errors
    // when copying to EdenFS/NFS-backed directories on macOS
    if (os.platform() === 'darwin') {
      runCommandSync('xattr', ['-rc', tmpPath]);
    }

    fs.copyFileSync(tmpPath, destTmpPath);

    try {
      fs.renameSync(destTmpPath, destPath);
    } catch (e: unknown) {
      // Another process may have created the file already - that's fine
      const code =
        typeof e === 'object' && e != null && typeof e.code === 'string'
          ? e.code
          : null;
      if (code !== 'EEXIST' && !fs.existsSync(destPath)) {
        throw e;
      }
    }
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {}
    try {
      fs.unlinkSync(destTmpPath);
    } catch {}
  }
}

export function run(
  args: ReadonlyArray<string>,
  options: TesterOptions,
): AsyncCommandResult {
  if (isCI && debugCpp) {
    throw new Error('Cannot run Fantom with C++ debugging on CI');
  }

  if (!isCI && !debugCpp) {
    build(options);
  }

  if (debugCpp) {
    return runBuck2(
      [
        'run',
        ...getBuckModesForPlatform(options.isOptimizedMode),
        ...getBuckOptionsForHermes(options.hermesVariant),
        FANTOM_TESTER_BUCK_TARGET,
        '--',
        ...args,
      ],
      {
        withFDB: true,
      },
    );
  }

  return runCommand(getFantomTesterPath(options), args);
}
