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

import {debugCpp, isCI, profileCpp} from '../EnvironmentOptions';
import {CPP_TRACES_OUTPUT_PATH, NATIVE_BUILD_OUTPUT_PATH} from '../paths';
import {
  getBuckModesForPlatform,
  getBuckOptionsForHermes,
  getDebugInfoFromCommandResult,
  runBuck2,
  runBuck2Sync,
  runCommand,
} from '../utils';
import fs from 'fs';
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

  const tmpPath = destPath + '-' + Date.now();

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

    fs.renameSync(tmpPath, destPath);
  } finally {
    try {
      fs.unlinkSync(tmpPath);
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

  if (isCI && profileCpp) {
    throw new Error('Cannot run Fantom with C++ profiling on CI');
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

  const testerPath = getFantomTesterPath(options);

  if (profileCpp) {
    // Ensure output directory exists
    if (!fs.existsSync(CPP_TRACES_OUTPUT_PATH)) {
      fs.mkdirSync(CPP_TRACES_OUTPUT_PATH, {recursive: true});
    }

    // Generate unique output path for perf data
    const perfOutputPath = path.join(
      CPP_TRACES_OUTPUT_PATH,
      `perf-${Date.now()}.data`,
    );

    // Wrap command with perf record
    // -g: enable call-graph (stack traces)
    // -F 997: sample at 997 Hz (prime number to avoid aliasing)
    // --call-graph dwarf: use DWARF for accurate stack traces
    const result = runCommand('perf', [
      'record',
      '-g',
      '-F',
      '997',
      '--call-graph',
      'dwarf',
      '-o',
      perfOutputPath,
      '--',
      testerPath,
      ...args,
    ]);

    // Log the output path after the command starts
    console.log(
      `\n🔥 C++ sampling profiler recording to: ${perfOutputPath}\n` +
        `   View with: perf report -i ${perfOutputPath}\n`,
    );

    return result;
  }

  return runCommand(testerPath, args);
}
