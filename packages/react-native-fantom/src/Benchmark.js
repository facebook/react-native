/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {getConstants} from './index';
import nullthrows from 'nullthrows';
import NativeCPUTime from 'react-native/src/private/testing/fantom/specs/NativeCPUTime';
import {
  Bench,
  type BenchOptions,
  type FnOptions,
  type TaskResult,
} from 'tinybench';

type SuiteOptions = $ReadOnly<{
  minIterations?: number,
  minDuration?: number,
  warmup?: boolean,
  minWarmupDuration?: number,
  minWarmupIterations?: number,
  disableOptimizedBuildCheck?: boolean,
}>;

type SuiteResults = Array<$ReadOnly<TaskResult>>;

interface SuiteAPI {
  add(name: string, fn: () => void, options?: FnOptions): SuiteAPI;
  verify(fn: (results: SuiteResults) => void): SuiteAPI;
}

export function suite(
  suiteName: string,
  suiteOptions?: SuiteOptions = {},
): SuiteAPI {
  const tasks: Array<{
    name: string,
    fn: () => void,
    options: FnOptions | void,
  }> = [];
  const verifyFns = [];

  global.it(suiteName, () => {
    if (tasks.length === 0) {
      throw new Error('No benchmark tests defined');
    }

    const {isRunningFromCI} = getConstants();

    // If we're running from CI and there's no verification function, there's
    // no point in running the benchmark.
    // We still run a single iteration of each test just to make sure that the
    // logic in the benchmark doesn't break.
    const isTestOnly = isRunningFromCI && verifyFns.length === 0;

    const benchOptions: BenchOptions = isTestOnly
      ? {
          warmupIterations: 1,
          warmupTime: 0,
          iterations: 1,
          time: 0,
        }
      : {};

    benchOptions.name = suiteName;
    benchOptions.throws = true;
    benchOptions.now = () => NativeCPUTime.getCPUTimeNanos() / 1000000;

    if (suiteOptions.minIterations != null) {
      benchOptions.iterations = suiteOptions.minIterations;
    }

    if (suiteOptions.minDuration != null) {
      benchOptions.time = suiteOptions.minDuration;
    }

    if (suiteOptions.warmup != null) {
      benchOptions.warmup = suiteOptions.warmup;
    }

    if (suiteOptions.minWarmupDuration != null) {
      benchOptions.warmupTime = suiteOptions.minWarmupDuration;
    }

    if (suiteOptions.minWarmupIterations != null) {
      benchOptions.warmupIterations = suiteOptions.minWarmupIterations;
    }

    const bench = new Bench(benchOptions);

    for (const task of tasks) {
      bench.add(task.name, task.fn, task.options);
    }

    bench.runSync();

    if (!isTestOnly) {
      printBenchmarkResults(bench);
    }

    for (const verify of verifyFns) {
      verify(bench.results);
    }

    if (!isTestOnly && !NativeCPUTime.hasAccurateCPUTimeNanosForBenchmarks()) {
      throw new Error(
        '`NativeCPUTime` module does not provide accurate CPU time information in this environment. Please run the benchmarks in an environment where it does.',
      );
    }

    if (__DEV__ && suiteOptions.disableOptimizedBuildCheck !== true) {
      throw new Error('Benchmarks should not be run in development mode');
    }
  });

  const suiteAPI = {
    add(name: string, fn: () => void, options?: FnOptions): SuiteAPI {
      tasks.push({name, fn, options});
      return suiteAPI;
    },
    verify(fn: (results: SuiteResults) => void): SuiteAPI {
      verifyFns.push(fn);
      return suiteAPI;
    },
  };

  return suiteAPI;
}

function printBenchmarkResults(bench: Bench) {
  const longestTaskNameLength = bench.tasks.reduce(
    (maxLength, task) => Math.max(maxLength, task.name.length),
    0,
  );
  const separatorWidth = 137 + longestTaskNameLength - 'Task name'.length;
  const benchmarkName = bench.name ?? 'Benchmark';

  console.log('-'.repeat(separatorWidth));
  console.log(
    `| ${benchmarkName}${' '.repeat(separatorWidth - (4 + benchmarkName.length))} |`,
  );
  console.log('-'.repeat(separatorWidth));
  console.table(nullthrows(bench.table()));
  console.log('-'.repeat(separatorWidth) + '\n');
}
