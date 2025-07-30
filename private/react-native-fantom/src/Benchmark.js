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

export type SuiteOptions = $ReadOnly<{
  minIterations?: number,
  minDuration?: number,
  warmup?: boolean,
  minWarmupDuration?: number,
  minWarmupIterations?: number,
  disableOptimizedBuildCheck?: boolean,
  testOnly?: boolean,
}>;

export type TestOptions = FnOptions;

type InternalTestOptions = $ReadOnly<{
  ...FnOptions,
  only?: boolean,
}>;

type SuiteResults = Array<$ReadOnly<TaskResult>>;

type TestWithArgName<TestArgType> = string | ((testArg: TestArgType) => string);

type TestWithArgOptions<TestArgType> =
  | FnOptions
  | ((testArg: TestArgType) => FnOptions);

interface ParameterizedTestFunction {
  <TestArgType>(
    testArgs: $ReadOnlyArray<TestArgType>,
    name: TestWithArgName<TestArgType>,
    fn: (testArg: TestArgType) => void,
    options?: TestWithArgOptions<TestArgType>,
  ): SuiteAPI;
  only: <TestArgType>(
    testArgs: $ReadOnlyArray<TestArgType>,
    name: TestWithArgName<TestArgType>,
    fn: (testArg: TestArgType) => void,
    options?: TestWithArgOptions<TestArgType>,
  ) => SuiteAPI;
}

interface TestFunction {
  (name: string, fn: () => void, options?: FnOptions): SuiteAPI;
  only: (name: string, fn: () => void, options?: FnOptions) => SuiteAPI;
  // `each` allows to run the same test multiple times with different arguments, provided as an array of values:
  each: ParameterizedTestFunction;
}

interface SuiteAPI {
  +test: TestFunction;
  verify(fn: (results: SuiteResults) => void): SuiteAPI;
}

interface TestTask {
  name: string;
  fn: () => void;
  options: InternalTestOptions | void;
}

export function suite(
  suiteName: string,
  suiteOptions?: SuiteOptions = {},
): SuiteAPI {
  const tasks: Array<TestTask> = [];
  const verifyFns = [];

  global.it(suiteName, () => {
    if (tasks.length === 0) {
      throw new Error('No benchmark tests defined');
    }

    const {isRunningFromCI, forceTestModeForBenchmarks} = getConstants();

    // If we're running from CI and there's no verification function, there's
    // no point in running the benchmark.
    // We still run a single iteration of each test just to make sure that the
    // logic in the benchmark doesn't break.
    const isTestOnly =
      suiteOptions.testOnly === true ||
      forceTestModeForBenchmarks ||
      (isRunningFromCI && verifyFns.length === 0);

    const benchOptions: BenchOptions = isTestOnly
      ? {
          warmup: false,
          iterations: 1,
          time: 0,
        }
      : {};

    benchOptions.name = suiteName;
    benchOptions.throws = true;
    benchOptions.now = () => NativeCPUTime.getCPUTimeNanos() / 1000000;

    if (!isTestOnly) {
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
    }

    const bench = new Bench(benchOptions);

    const isFocused = tasks.find(task => task.options?.only === true) != null;

    for (const task of tasks) {
      if (isFocused && task.options?.only !== true) {
        continue;
      }

      if (task.fn.name === '') {
        // $FlowExpectedError[cannot-write]
        Object.defineProperty(task.fn, 'name', {value: task.name});
      }

      const {only, ...options} = task.options ?? {};
      bench.add(task.name, task.fn, options);
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

    if (isFocused) {
      throw new Error(
        'Failing focused test to prevent it from being committed',
      );
    }
  });

  const test = (
    name: string,
    fn: () => void,
    options?: FnOptions,
  ): SuiteAPI => {
    tasks.push({name, fn, options});
    return suiteAPI;
  };

  test.only = (name: string, fn: () => void, options?: FnOptions): SuiteAPI => {
    tasks.push({name, fn, options: {...options, only: true}});
    return suiteAPI;
  };

  const testWithArg = <TestArgType>(
    testArg: TestArgType,
    name: TestWithArgName<TestArgType>,
    fn: (testArg: TestArgType) => void,
    options?: TestWithArgOptions<TestArgType>,
    only?: boolean = false,
  ): TestTask => {
    const taskName =
      typeof name === 'function'
        ? name(testArg)
        : `${name} [arg=${String(testArg)}]`;
    const taskOptions =
      typeof options === 'function' ? options(testArg) : options;
    const taskFn = () => fn(testArg);
    return {name: taskName, fn: taskFn, options: {...taskOptions, only}};
  };

  // $FlowIssue[incompatible-type]
  const testEach: ParameterizedTestFunction = <TestArgType>(
    testArgs: $ReadOnlyArray<TestArgType>,
    name: TestWithArgName<TestArgType>,
    fn: (testArg: TestArgType) => void,
    options?: TestWithArgOptions<TestArgType>,
  ): SuiteAPI => {
    for (const testArg of testArgs) {
      tasks.push(testWithArg(testArg, name, fn, options));
    }
    return suiteAPI;
  };

  testEach.only = (testArgs, name, fn, options) => {
    for (const testArg of testArgs) {
      tasks.push(testWithArg(testArg, name, fn, options, true));
    }
    return suiteAPI;
  };

  test.each = testEach;

  const suiteAPI = {
    test,
    verify(fn: (results: SuiteResults) => void): SuiteAPI {
      verifyFns.push(fn);
      return suiteAPI;
    },
  };

  return suiteAPI;
}

function printBenchmarkResults(bench: Bench) {
  const {fantomConfigSummary} = getConstants();
  const benchmarkName =
    (bench.name ?? 'Benchmark') +
    (fantomConfigSummary ? ` (${fantomConfigSummary})` : '');

  console.log('');
  console.log(`### ${benchmarkName} ###`);
  console.table(nullthrows(bench.table()));
  console.log('');
}
