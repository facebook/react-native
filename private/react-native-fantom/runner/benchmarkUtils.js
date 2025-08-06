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
  const numberOfTests = testResults.length;
  if (numberOfTests <= 1 || testResults[0].testArtifact === undefined) {
    // No test variations to compare between, or there are no benchmak results present, just don't print anything
    return;
  }

  const testTaskTimings: {[string]: Array<[string, number]>} = {};
  for (let i = 0; i < numberOfTests; i++) {
    if (testResults[i] == null) {
      continue;
    }
    // $FlowExpectedError[incompatible-cast]
    const testArtifact = testResults[i].testArtifact as ?BenchmarkTestArtifact;
    const testVariationName = testResults[i].title;
    if (
      testArtifact == null ||
      testArtifact.type !== 'benchmark' ||
      testVariationName == null
    ) {
      continue;
    }
    for (const taskTiming of testArtifact.timings) {
      const taskName = taskTiming.name;
      if (testTaskTimings[taskName] === undefined) {
        testTaskTimings[taskName] = [];
      }
      testTaskTimings[taskName].push([
        testVariationName,
        taskTiming.latency.p50,
      ]);
    }
  }

  // Sort each task's executions by latency
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
    console.log('\n');
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
