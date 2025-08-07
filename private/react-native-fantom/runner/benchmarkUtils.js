/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {BenchmarkResult} from '../src/Benchmark';

import {markdownTable} from './utils';

export const printBenchmarkResultsRanking = (
  benchmarkResults: Array<{
    title: string,
    result: BenchmarkResult,
  }>,
) => {
  const testTaskTimings: {[string]: {[string]: number}} = {};
  let numTestVariants = 0;

  for (const benchmarkResult of benchmarkResults) {
    const result = benchmarkResult.result;
    if (
      result == null ||
      result.timings == null ||
      benchmarkResult.title == null
    ) {
      continue;
    }
    numTestVariants++;
    for (const taskTiming of result.timings) {
      const taskName = taskTiming.name;
      if (testTaskTimings[taskName] === undefined) {
        testTaskTimings[taskName] = {};
      }
      testTaskTimings[taskName][benchmarkResult.title] =
        taskTiming.latency?.p50 ?? taskTiming.latency.mean;
    }
  }
  if (numTestVariants <= 1 || Object.keys(testTaskTimings).length === 0) {
    // No benchmark results to print, or there is nothing to compare with
    return;
  }

  // Find relative execution times for tasks
  const results: {[string]: {[string]: string}} = {};
  for (const taskName in testTaskTimings) {
    const kv = Object.entries(testTaskTimings[taskName]);
    kv.sort((a, b) => a[1] - b[1]);
    const bestTiming = kv[0][1];
    results[taskName] = {};
    kv.forEach(([key, val]) => {
      results[taskName][key] =
        `${val.toFixed(3)}ms ${getTimingDelta(bestTiming, val)}`;
    });
    results[taskName][kv[0][0]] = `🏆 ${bestTiming.toFixed(3)}ms`;
  }

  console.log('### Benchmark Times Comparison (p50): ###');
  console.log(markdownTable(results, 'Task name'));
  console.log('');
};

function getTimingDelta(lastTiming: ?number, currentTiming: ?number): string {
  if (lastTiming != null && currentTiming != null) {
    const deltaPercent = ((currentTiming - lastTiming) / lastTiming) * 100;
    return `(${deltaPercent.toFixed(2)}% ${deltaPercent > 0 ? 'slower' : 'faster'})`;
  } else {
    return '';
  }
}
