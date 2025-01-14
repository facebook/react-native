/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import {
  getBuckModesForPlatform,
  getDebugInfoFromCommandResult,
  runBuck2Sync,
} from '../utils';
// $FlowExpectedError[untyped-import]
import fs from 'fs';
import Metro from 'metro';
import os from 'os';
import path from 'path';

async function tryOrLog(
  fn: () => void | Promise<void>,
  message: string,
): Promise<void> {
  try {
    await fn();
  } catch (e) {
    // Sandcastle fails to parse the test output if we log stuff to stdout/stderr.
    if ((process.env.SANDCASTLE ?? '') !== '') {
      console.error(
        'Global warmup failed. Tests will continue to run but will likely fail. Details:\n',
        message,
        e,
      );
    }
  }
}

export default async function warmUp(
  globalConfig: {...},
  projectConfig: {...},
): Promise<void> {
  await tryOrLog(
    () => warmUpHermesCompiler(false),
    'Error warming up Hermes compiler (dev)',
  );
  await tryOrLog(
    () => warmUpHermesCompiler(true),
    'Error warming up Hermes compiler (opt)',
  );
  await tryOrLog(
    () => warmUpRNTesterCLI(false),
    'Error warming up RN Tester CLI (dev)',
  );
  await tryOrLog(
    () => warmUpRNTesterCLI(true),
    'Error warming up RN Tester CLI (opt)',
  );
  await tryOrLog(() => warmUpMetro(false), 'Error warming up Metro (dev)');
  await tryOrLog(() => warmUpMetro(true), 'Error warming up Metro (opt)');
}

async function warmUpMetro(isOptimizedMode: boolean): Promise<void> {
  const metroConfig = await Metro.loadConfig({
    config: path.resolve(__dirname, '..', '..', 'config', 'metro.config.js'),
  });

  const entrypointPath = path.resolve(
    __dirname,
    '..',
    '..',
    'runtime',
    'WarmUpEntryPoint.js',
  );

  const bundlePath = path.join(
    os.tmpdir(),
    `fantom-warmup-bundle-${Date.now()}.js`,
  );

  await Metro.runBuild(metroConfig, {
    entry: entrypointPath,
    out: bundlePath,
    platform: 'android',
    minify: isOptimizedMode,
    dev: !isOptimizedMode,
  });

  try {
    fs.unlinkSync(bundlePath);
  } catch {}
}

function warmUpHermesCompiler(isOptimizedMode: boolean): void {
  const buildHermesCompilerCommandResult = runBuck2Sync([
    'build',
    ...getBuckModesForPlatform(isOptimizedMode),
    '//xplat/hermes/tools/hermesc:hermesc',
  ]);

  if (buildHermesCompilerCommandResult.status !== 0) {
    throw new Error(
      getDebugInfoFromCommandResult(buildHermesCompilerCommandResult),
    );
  }
}

function warmUpRNTesterCLI(isOptimizedMode: boolean): void {
  const buildRNTesterCommandResult = runBuck2Sync([
    'build',
    ...getBuckModesForPlatform(isOptimizedMode),
    '//xplat/ReactNative/react-native-cxx/samples/tester:tester',
  ]);

  if (buildRNTesterCommandResult.status !== 0) {
    throw new Error(getDebugInfoFromCommandResult(buildRNTesterCommandResult));
  }
}
