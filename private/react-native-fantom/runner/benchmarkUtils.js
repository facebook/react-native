/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {markdownTable} from './utils';

type TestTaskTiming = {
  name: string,
  latency: {
    mean: number,
    min: number,
    max: number,
    p50: number,
    p75: number,
    p99: number,
  },
};

export type BenchmarkTestArtifact = {
  type: string,
  timings: $ReadOnlyArray<TestTaskTiming>,
};

export const printBenchmarkResultsRanking = (
  testResults: Array<{
    title: string,
    testArtifact: mixed,
  }>,
) => {
  const testTaskTimings: {[string]: {[string]: number}} = {};
  let numTestVariants = 0;

  for (const testResult of testResults) {
    // $FlowExpectedError[incompatible-cast]
    const testArtifact = testResult?.testArtifact as ?BenchmarkTestArtifact;
    if (
      testArtifact == null ||
      testArtifact.timings == null ||
      testArtifact.type !== 'benchmark' ||
      testResult.title == null
    ) {
      continue;
    }
    numTestVariants++;
    for (const taskTiming of testArtifact.timings) {
      const taskName = taskTiming.name;
      if (testTaskTimings[taskName] === undefined) {
        testTaskTimings[taskName] = {};
      }
      testTaskTimings[taskName][testResult.title] = taskTiming.latency.p50;
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
