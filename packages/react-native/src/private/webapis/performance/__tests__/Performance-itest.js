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

import type Performance from '../Performance';

import ensureInstance from '../../../__tests__/utilities/ensureInstance';
import DOMException from '../../errors/DOMException';
import NativePerformance from '../specs/NativePerformance';
import {PerformanceMark, PerformanceMeasure} from '../UserTiming';

/* eslint-disable jest/no-disabled-tests */

declare var performance: Performance;

function getThrownError(fn: () => mixed): mixed {
  try {
    fn();
  } catch (e) {
    return e;
  }
  throw new Error('Expected function to throw');
}

describe('Performance', () => {
  beforeEach(() => {
    performance.clearMarks();
    performance.clearMeasures();
  });

  describe('mark', () => {
    it('works with default timestamp', () => {
      NativePerformance?.setCurrentTimeStampForTesting?.(25);

      const mark = performance.mark('mark-now');

      expect(mark).toBeInstanceOf(PerformanceMark);
      expect(mark.entryType).toBe('mark');
      expect(mark.name).toBe('mark-now');
      expect(mark.startTime).toBe(25);
      expect(mark.duration).toBe(0);
      expect(mark.detail).toBeUndefined();
    });

    it('works with custom timestamp', () => {
      const mark = performance.mark('mark-custom', {startTime: 10});

      expect(mark).toBeInstanceOf(PerformanceMark);
      expect(mark.entryType).toBe('mark');
      expect(mark.name).toBe('mark-custom');
      expect(mark.startTime).toBe(10);
      expect(mark.duration).toBe(0);
      expect(mark.detail).toBeUndefined();
    });

    it('provides detail', () => {
      const originalDetail = {foo: 'bar'};

      const mark = performance.mark('some-mark', {
        detail: originalDetail,
      });

      expect(mark.detail).toEqual(originalDetail);
      // TODO structuredClone
      // expect(mark.detail).not.toBe(originalDetail);
    });

    it.skip('throws if no name is provided', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-call]
        performance.mark();
      }).toThrow(
        `Failed to execute 'mark' on 'Performance': 1 argument required, but only 0 present.`,
      );
    });

    it.skip('casts startTime to a number', () => {
      const mark = performance.mark('some-mark', {
        // $FlowExpectedError[incompatible-call]
        startTime: '10',
      });

      expect(mark.startTime).toBe(10);

      const mark2 = performance.mark('some-mark', {
        // $FlowExpectedError[incompatible-call]
        startTime: null,
      });

      expect(mark2.startTime).toBe(0);
    });

    it.skip('throws if startTime cannot be converted to a finite number', () => {
      expect(() => {
        performance.mark('some-mark', {startTime: NaN});
      }).toThrow(
        `Failed to execute 'mark' on 'Performance': Failed to read the 'startTime' property from 'PerformanceMarkOptions': The provided double value is non-finite.`,
      );

      expect(() => {
        // $FlowExpectedError[incompatible-call]
        performance.mark('some-mark', {startTime: {}});
      }).toThrow(
        `Failed to execute 'mark' on 'Performance': Failed to read the 'startTime' property from 'PerformanceMarkOptions': The provided double value is non-finite.`,
      );
    });

    it.skip('throws if startTime is negative', () => {
      expect(() => {
        performance.mark('some-mark', {startTime: -1});
      }).toThrow(
        `Failed to execute 'mark' on 'Performance': 'some-mark' cannot have a negative start time.`,
      );
    });
  });

  describe('measure', () => {
    describe('with measureOptions', () => {
      it.skip('uses 0 as default start and now as default end', () => {
        NativePerformance?.setCurrentTimeStampForTesting?.(25);

        const measure = performance.measure('measure-with-defaults', {});

        expect(measure).toBeInstanceOf(PerformanceMeasure);
        expect(measure.entryType).toBe('measure');
        expect(measure.name).toBe('measure-with-defaults');
        expect(measure.startTime).toBe(0);
        expect(measure.duration).toBe(25);
        expect(measure.detail).toBeUndefined();
      });

      it.skip('works with a start timestamp', () => {
        NativePerformance?.setCurrentTimeStampForTesting?.(25);

        const measure = performance.measure('measure-with-start-timestamp', {
          start: 10,
        });

        expect(measure).toBeInstanceOf(PerformanceMeasure);
        expect(measure.entryType).toBe('measure');
        expect(measure.name).toBe('measure-with-start-timestamp');
        expect(measure.startTime).toBe(10);
        expect(measure.duration).toBe(15);
        expect(measure.detail).toBeUndefined();
      });

      it.skip('works with start mark', () => {
        NativePerformance?.setCurrentTimeStampForTesting?.(25);

        performance.mark('start-mark', {
          startTime: 10,
        });

        const measure = performance.measure('measure-with-start-mark', {
          start: 'start-mark',
        });

        expect(measure).toBeInstanceOf(PerformanceMeasure);
        expect(measure.entryType).toBe('measure');
        expect(measure.name).toBe('measure-with-start-mark');
        expect(measure.startTime).toBe(10);
        expect(measure.duration).toBe(15);
        expect(measure.detail).toBeUndefined();
      });

      it.skip('works with end mark', () => {
        NativePerformance?.setCurrentTimeStampForTesting?.(25);

        performance.mark('end-mark', {
          startTime: 50,
        });

        const measure = performance.measure('measure-with-end-mark', {
          end: 'end-mark',
        });

        expect(measure).toBeInstanceOf(PerformanceMeasure);
        expect(measure.entryType).toBe('measure');
        expect(measure.name).toBe('measure-with-end-mark');
        expect(measure.startTime).toBe(0);
        expect(measure.duration).toBe(50);
        expect(measure.detail).toBeUndefined();
      });

      it.skip('works with start mark and end mark', () => {
        NativePerformance?.setCurrentTimeStampForTesting?.(25);

        performance.mark('start-mark', {
          startTime: 10,
        });

        performance.mark('end-mark', {
          startTime: 50,
        });

        const measure = performance.measure(
          'measure-with-start-mark-and-end-mark',
          {
            start: 'start-mark',
            end: 'end-mark',
          },
        );

        expect(measure).toBeInstanceOf(PerformanceMeasure);
        expect(measure.entryType).toBe('measure');
        expect(measure.name).toBe('measure-with-start-mark-and-end-mark');
        expect(measure.startTime).toBe(10);
        expect(measure.duration).toBe(40);
        expect(measure.detail).toBeUndefined();
      });

      it('works with a start timestamp and an end timestamp', () => {
        const measure = performance.measure(
          'measure-with-start-timestamp-and-end-timestamp',
          {
            start: 10,
            end: 25,
          },
        );

        expect(measure).toBeInstanceOf(PerformanceMeasure);
        expect(measure.entryType).toBe('measure');
        expect(measure.name).toBe(
          'measure-with-start-timestamp-and-end-timestamp',
        );
        expect(measure.startTime).toBe(10);
        expect(measure.duration).toBe(15);
        expect(measure.detail).toBeUndefined();
      });

      it.skip('works with a start timestamp and a duration', () => {
        const measure = performance.measure(
          'measure-with-start-timestamp-and-duration',
          {
            start: 10,
            duration: 30,
          },
        );

        expect(measure).toBeInstanceOf(PerformanceMeasure);
        expect(measure.entryType).toBe('measure');
        expect(measure.name).toBe('measure-with-start-timestamp-and-duration');
        expect(measure.startTime).toBe(10);
        expect(measure.duration).toBe(30);
        expect(measure.detail).toBeUndefined();
      });

      it.skip('works with a start mark and a duration', () => {
        performance.mark('start-mark', {
          startTime: 10,
        });

        const measure = performance.measure(
          'measure-with-start-mark-and-duration',
          {
            start: 'start-mark',
            duration: 30,
          },
        );

        expect(measure).toBeInstanceOf(PerformanceMeasure);
        expect(measure.entryType).toBe('measure');
        expect(measure.name).toBe('measure-with-start-mark-and-duration');
        expect(measure.startTime).toBe(10);
        expect(measure.duration).toBe(30);
        expect(measure.detail).toBeUndefined();
      });

      it('throws if the specified mark does NOT exist', () => {
        const missingStartMarkError = ensureInstance(
          getThrownError(() => {
            performance.measure('measure', {
              start: 'start',
              end: 'end',
            });
          }),
          DOMException,
        );

        expect(missingStartMarkError.name).toBe('SyntaxError');
        expect(missingStartMarkError.message).toBe(
          "Failed to execute 'measure' on 'Performance': The mark 'start' does not exist.",
        );

        performance.mark('start');

        const missingEndMarkError = ensureInstance(
          getThrownError(() => {
            performance.measure('measure', {
              start: 'start',
              end: 'end',
            });
          }),
          DOMException,
        );

        expect(missingEndMarkError.message).toBe(
          "Failed to execute 'measure' on 'Performance': The mark 'end' does not exist.",
        );

        performance.mark('end');
        expect(() => {
          performance.measure('measure', {
            start: 'start',
            end: 'end',
          });
        }).not.toThrow();
      });
    });

    describe('with startMark / endMark', () => {
      it.skip('uses 0 as default start and now as default end', () => {
        NativePerformance?.setCurrentTimeStampForTesting?.(25);

        const measure = performance.measure('measure-with-defaults', undefined);

        expect(measure).toBeInstanceOf(PerformanceMeasure);
        expect(measure.entryType).toBe('measure');
        expect(measure.name).toBe('measure-with-defaults');
        expect(measure.startTime).toBe(0);
        expect(measure.duration).toBe(25);
        expect(measure.detail).toBeUndefined();
      });

      it.skip('works with startMark', () => {
        NativePerformance?.setCurrentTimeStampForTesting?.(25);

        performance.mark('start-mark', {
          startTime: 10,
        });

        const measure = performance.measure(
          'measure-with-start-mark',
          'start-mark',
        );

        expect(measure).toBeInstanceOf(PerformanceMeasure);
        expect(measure.entryType).toBe('measure');
        expect(measure.name).toBe('measure-with-start-mark');
        expect(measure.startTime).toBe(10);
        expect(measure.duration).toBe(15);
        expect(measure.detail).toBeUndefined();
      });

      it.skip('works with startMark and endMark', () => {
        NativePerformance?.setCurrentTimeStampForTesting?.(25);

        performance.mark('start-mark', {
          startTime: 10,
        });

        performance.mark('end-mark', {
          startTime: 25,
        });

        const measure = performance.measure(
          'measure-with-start-mark-and-end-mark',
          'start-mark',
        );

        expect(measure).toBeInstanceOf(PerformanceMeasure);
        expect(measure.entryType).toBe('measure');
        expect(measure.name).toBe('measure-with-start-mark-and-end-mark');
        expect(measure.startTime).toBe(10);
        expect(measure.duration).toBe(15);
        expect(measure.detail).toBeUndefined();
      });

      it('throws if the specified marks do NOT exist', () => {
        const missingStartMarkError = ensureInstance(
          getThrownError(() => {
            performance.measure('measure', 'start', 'end');
          }),
          DOMException,
        );

        expect(missingStartMarkError.name).toBe('SyntaxError');
        expect(missingStartMarkError.message).toBe(
          "Failed to execute 'measure' on 'Performance': The mark 'start' does not exist.",
        );

        performance.mark('start');

        const missingEndMarkError = ensureInstance(
          getThrownError(() => {
            performance.measure('measure', 'start', 'end');
          }),
          DOMException,
        );

        expect(missingEndMarkError.message).toBe(
          "Failed to execute 'measure' on 'Performance': The mark 'end' does not exist.",
        );

        performance.mark('end');
        expect(() => {
          performance.measure('measure', 'start', 'end');
        }).not.toThrow();
      });
    });

    it('provides detail', () => {
      const originalDetail = {foo: 'bar'};

      const measure = performance.measure('measure-with-detail', {
        start: 10,
        end: 20,
        detail: originalDetail,
      });

      expect(measure.detail).toEqual(originalDetail);
      // TODO structuredClone
      // expect(measure.detail).not.toBe(originalDetail);
    });
  });
});
