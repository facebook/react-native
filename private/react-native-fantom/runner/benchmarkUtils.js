/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

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
  const testTaskTimings: {[string]: Array<[string, number]>} = {};
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
        testTaskTimings[taskName] = [];
      }
      testTaskTimings[taskName].push([
        testResult.title,
        taskTiming.latency.p50,
      ]);
    }
  }
  if (numTestVariants <= 1 || Object.keys(testTaskTimings).length === 0) {
    // No benchmark results to print, or there is nothing to compare with
    return;
  }

  // Sort by each task's execution times
  for (const taskName in testTaskTimings) {
    testTaskTimings[taskName].sort((a, b) => a[1] - b[1]);
  }

  // Print the rankings
  console.log('### Benchmark Results Ranking ###');
  for (const taskName in testTaskTimings) {
    console.log(`> ${taskName}:`);
    let lastTiming;
    for (const [i, [testVariationName, latency]] of testTaskTimings[
      taskName
    ].entries()) {
      console.log(
        `  ${i + 1}. ${testVariationName}: ${latency.toFixed(2)}ms ${getTimingDelta(lastTiming, latency)}`,
      );
      lastTiming = latency;
    }
  }
};

function getTimingDelta(lastTiming: ?number, currentTiming: ?number): string {
  if (lastTiming != null && currentTiming != null) {
    const deltaPercent = ((currentTiming - lastTiming) / lastTiming) * 100;
    return `(${deltaPercent.toFixed(2)}% ${deltaPercent > 0 ? 'slower' : 'faster'})`;
  } else {
    return '';
  }
}
