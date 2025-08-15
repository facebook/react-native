/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';
import * as Fantom from '@react-native/fantom';

let runs = 0;

// We need to use `afterAll` because the benchmark API defines tests in Jest,
// and we can't call it from within other tests.
afterAll(() => {
  expect(runs).toBe(1);
});

Fantom.unstable_benchmark
  .suite('Benchmark test', {
    testOnly: true,

    // Ignores warmup, iterations and duration
    warmup: true,
    minWarmupIterations: 10,
    minIterations: 10,
    minDuration: 1000,
    minWarmupDuration: 1000,
  })
  .test('test', () => {
    runs++;
  });
