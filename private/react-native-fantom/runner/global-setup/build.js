/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {isCI} from '../EnvironmentOptions';
import {build as buildHermesCompiler} from '../executables/hermesc';
import {build as buildFantomTester} from '../executables/tester';
import {getNativeBuildOutputPath} from '../executables/utils';
import {HermesVariant} from '../utils';
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

export default async function build(): Promise<void> {
  try {
    fs.rmSync(getNativeBuildOutputPath(), {recursive: true});
  } catch {}

  fs.mkdirSync(getNativeBuildOutputPath(), {recursive: true});

  if (isCI) {
    for (const isOptimizedMode of [false, true]) {
      for (const hermesVariant of HermesVariant.members()) {
        buildFantomTester({isOptimizedMode, hermesVariant});
        buildHermesCompiler({isOptimizedMode, hermesVariant});
      }
    }

    await tryOrLog(() => warmUpMetro(false), 'Error warming up Metro (dev)');
    await tryOrLog(() => warmUpMetro(true), 'Error warming up Metro (opt)');
  }
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
