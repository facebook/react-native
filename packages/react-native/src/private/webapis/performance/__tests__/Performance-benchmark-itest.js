/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 * @fantom_mode opt
 */

import 'react-native/Libraries/Core/InitializeCore';

import type Performance from 'react-native/src/private/webapis/performance/Performance';

import * as Fantom from '@react-native/fantom';

declare var performance: Performance;

const clearMarksAndMeasures = () => {
  performance.clearMarks();
  performance.clearMeasures();
};

Fantom.unstable_benchmark
  .suite('Performance API')
  .test(
    'mark (default)',
    () => {
      performance.mark('mark');
    },
    {
      afterEach: clearMarksAndMeasures,
    },
  )
  .test(
    'mark (with custom startTime)',
    () => {
      performance.mark('mark', {
        startTime: 100,
      });
    },
    {
      afterEach: clearMarksAndMeasures,
    },
  )
  .test(
    'measure (with start and end timestamps)',
    () => {
      performance.measure('measure', {
        start: 100,
        end: 300,
      });
    },
    {
      afterEach: clearMarksAndMeasures,
    },
  )
  .test(
    'measure (with mark names)',
    () => {
      performance.measure('measure', 'measure-start', 'measure-end');
    },
    {
      beforeEach: () => {
        performance.mark('measure-start', {
          startTime: 100,
        });
        performance.mark('measure-end', {
          startTime: 300,
        });
      },
      afterEach: clearMarksAndMeasures,
    },
  )
  .test(
    'clearMarks',
    () => {
      performance.clearMarks('mark');
    },
    {
      beforeEach: () => {
        performance.mark('mark');
      },
    },
  )
  .test(
    'clearMeasures',
    () => {
      performance.clearMeasures('measure');
    },
    {
      beforeEach: () => {
        performance.measure('measure', {
          start: 100,
          end: 300,
        });
      },
    },
  )
  .test('mark + clearMarks', () => {
    performance.mark('mark');
    performance.clearMarks('mark');
  })
  .test('measure + clearMeasures (with start and end timestamps)', () => {
    performance.measure('measure', {
      start: 100,
      end: 300,
    });
    performance.clearMeasures('measure');
  })
  .test(
    'measure + clearMeasures (with mark names)',
    () => {
      performance.measure('measure', 'measure-start', 'measure-end');
      performance.clearMeasures('measure');
    },
    {
      beforeEach: () => {
        performance.mark('measure-start', {
          startTime: 100,
        });
        performance.mark('measure-end', {
          startTime: 300,
        });
      },
      afterEach: clearMarksAndMeasures,
    },
  );
