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
  getBuckModeForPlatform,
  getDebugInfoFromCommandResult,
  runBuck2,
} from '../utils';
// $FlowExpectedError[untyped-import]
import fs from 'fs';
import Metro from 'metro';
import os from 'os';
import path from 'path';

export default async function warmUp(
  globalConfig: {...},
  projectConfig: {...},
): Promise<void> {
  try {
    warmUpHermesCompiler();
    warmUpRNTesterCLI();
    await warmUpMetro();
  } catch (e) {
    // Sandcastle fails to parse the test output if we log stuff to stdout/stderr.
    if ((process.env.SANDCASTLE ?? '') !== '') {
      console.error(
        'Global warmup failed. Tests will continue to run but will likely fail. Details:\n',
        e,
      );
    }
  }
}

async function warmUpMetro(): Promise<void> {
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
    minify: false,
    dev: true,
  });

  try {
    fs.unlinkSync(bundlePath);
  } catch {}
}

function warmUpHermesCompiler(): void {
  const buildHermesCompilerCommandResult = runBuck2([
    'build',
    getBuckModeForPlatform(),
    '//xplat/hermes/tools/hermesc:hermesc',
  ]);

  if (buildHermesCompilerCommandResult.status !== 0) {
    throw new Error(
      getDebugInfoFromCommandResult(buildHermesCompilerCommandResult),
    );
  }
}

function warmUpRNTesterCLI(): void {
  const buildRNTesterCommandResult = runBuck2([
    'build',
    getBuckModeForPlatform(),
    '//xplat/ReactNative/react-native-cxx/samples/tester:tester',
  ]);

  if (buildRNTesterCommandResult.status !== 0) {
    throw new Error(getDebugInfoFromCommandResult(buildRNTesterCommandResult));
  }
}
