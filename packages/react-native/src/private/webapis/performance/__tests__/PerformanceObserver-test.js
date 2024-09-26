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

import type {PerformanceEntryList} from '../PerformanceObserver';

jest.mock(
  '../specs/NativePerformance',
  () => require('../specs/__mocks__/NativePerformance').default,
);

jest.mock(
  '../specs/NativePerformanceObserver',
  () => require('../specs/__mocks__/NativePerformanceObserver').default,
);

// // NOTE: Jest mocks of transitive dependencies don't appear to work with
// // ES6 module imports, therefore forced to use commonjs style imports here.
const {PerformanceObserver} = require('../PerformanceObserver');
const NativePerformanceMock =
  require('../specs/__mocks__/NativePerformance').default;

describe('PerformanceObserver', () => {
  it('prevents durationThreshold to be used together with entryTypes', async () => {
    const observer = new PerformanceObserver((list, _observer) => {});

    expect(() =>
      // $FlowExpectedError[incompatible-call]
      observer.observe({entryTypes: ['event', 'mark'], durationThreshold: 100}),
    ).toThrow();
  });

  it('ignores durationThreshold when used with marks or measures', async () => {
    let entries: PerformanceEntryList = [];

    const observer = new PerformanceObserver((list, _observer) => {
      entries = [...entries, ...list.getEntries()];
    });

    observer.observe({type: 'measure', durationThreshold: 100});

    NativePerformanceMock?.measure('measure1', 0, 200);

    await jest.runAllTicks();
    expect(entries).toHaveLength(1);
    expect(entries.map(e => e.name)).toStrictEqual(['measure1']);
  });
});
