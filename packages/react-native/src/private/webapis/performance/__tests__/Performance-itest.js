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
import type {
  PerformanceEntryJSON,
  PerformanceEntryList,
} from '../PerformanceEntry';

import ensureInstance from '../../../__tests__/utilities/ensureInstance';
import DOMException from '../../errors/DOMException';
import NativePerformance from '../specs/NativePerformance';
import {PerformanceMark, PerformanceMeasure} from '../UserTiming';

declare var performance: Performance;

function getThrownError(fn: () => mixed): mixed {
  try {
    fn();
  } catch (e) {
    return e;
  }
  throw new Error('Expected function to throw');
}

function toJSON(entries: PerformanceEntryList): Array<PerformanceEntryJSON> {
  return entries.map(entry => entry.toJSON());
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
      expect(mark.detail).not.toBe(originalDetail);
    });

    it('throws if no name is provided', () => {
      expect(() => {
        // $FlowExpectedError[incompatible-call]
        performance.mark();
      }).toThrow(
        `Failed to execute 'mark' on 'Performance': 1 argument required, but only 0 present.`,
      );
    });

    it('casts startTime to a number', () => {
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

    it('throws if startTime cannot be converted to a finite number', () => {
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

    it('throws if startTime is negative', () => {
      expect(() => {
        performance.mark('some-mark', {startTime: -1});
      }).toThrow(
        `Failed to execute 'mark' on 'Performance': 'some-mark' cannot have a negative start time.`,
      );
    });
  });

  describe('measure', () => {
    describe('with measureOptions', () => {
      it('uses 0 as default start and now as default end', () => {
        NativePerformance?.setCurrentTimeStampForTesting?.(25);

        const measure = performance.measure('measure-with-defaults', {});

        expect(measure).toBeInstanceOf(PerformanceMeasure);
        expect(measure.entryType).toBe('measure');
        expect(measure.name).toBe('measure-with-defaults');
        expect(measure.startTime).toBe(0);
        expect(measure.duration).toBe(25);
        expect(measure.detail).toBeUndefined();
      });

      it('works with a start timestamp', () => {
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

      it('works with start mark', () => {
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

      it('works with end mark', () => {
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

      it('works with start mark and end mark', () => {
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

      it('works with a start timestamp and a duration', () => {
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

      it('works with a start mark and a duration', () => {
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
      it('uses 0 as default start and now as default end', () => {
        NativePerformance?.setCurrentTimeStampForTesting?.(25);

        const measure = performance.measure('measure-with-defaults');

        expect(measure).toBeInstanceOf(PerformanceMeasure);
        expect(measure.entryType).toBe('measure');
        expect(measure.name).toBe('measure-with-defaults');
        expect(measure.startTime).toBe(0);
        expect(measure.duration).toBe(25);
        expect(measure.detail).toBeUndefined();
      });

      it('works with startMark', () => {
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

      it('works with startMark and endMark', () => {
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
      expect(measure.detail).not.toBe(originalDetail);
    });
  });

  describe('getting and clearing marks and measures', () => {
    it('provides access to all buffered entries ordered by startTime', () => {
      performance.mark('baz', {startTime: 20});
      performance.mark('bar', {startTime: 30});
      performance.mark('foo', {startTime: 10});

      performance.mark('foo', {startTime: 50}); // again

      performance.measure('bar', {start: 20, duration: 40});
      performance.measure('foo', {start: 10, duration: 40});

      const expectedInitialEntries = [
        {
          duration: 0,
          entryType: 'mark',
          name: 'foo',
          startTime: 10,
        },
        {
          duration: 40,
          entryType: 'measure',
          name: 'foo',
          startTime: 10,
        },
        {
          duration: 0,
          entryType: 'mark',
          name: 'baz',
          startTime: 20,
        },
        {
          duration: 40,
          entryType: 'measure',
          name: 'bar',
          startTime: 20,
        },
        {
          duration: 0,
          entryType: 'mark',
          name: 'bar',
          startTime: 30,
        },
        {
          duration: 0,
          entryType: 'mark',
          name: 'foo',
          startTime: 50,
        },
      ];

      /*
       * getEntries
       */

      expect(toJSON(performance.getEntries())).toEqual(expectedInitialEntries);

      // Returns the same list again
      expect(toJSON(performance.getEntries())).toEqual(expectedInitialEntries);

      /*
       * getEntriesByType
       */

      expect(toJSON(performance.getEntriesByType('mark'))).toEqual(
        expectedInitialEntries.filter(entry => entry.entryType === 'mark'),
      );

      // Returns the same list again
      expect(toJSON(performance.getEntriesByType('mark'))).toEqual(
        expectedInitialEntries.filter(entry => entry.entryType === 'mark'),
      );

      expect(toJSON(performance.getEntriesByType('measure'))).toEqual(
        expectedInitialEntries.filter(entry => entry.entryType === 'measure'),
      );

      // Returns the same list again
      expect(toJSON(performance.getEntriesByType('measure'))).toEqual(
        expectedInitialEntries.filter(entry => entry.entryType === 'measure'),
      );

      /*
       * getEntriesByName
       */

      expect(toJSON(performance.getEntriesByName('foo'))).toEqual(
        expectedInitialEntries.filter(entry => entry.name === 'foo'),
      );

      // Returns the same list again
      expect(toJSON(performance.getEntriesByName('foo'))).toEqual(
        expectedInitialEntries.filter(entry => entry.name === 'foo'),
      );

      expect(toJSON(performance.getEntriesByName('bar'))).toEqual(
        expectedInitialEntries.filter(entry => entry.name === 'bar'),
      );

      // Returns the same list again
      expect(toJSON(performance.getEntriesByName('bar'))).toEqual(
        expectedInitialEntries.filter(entry => entry.name === 'bar'),
      );
    });

    it('clears entries as specified', () => {
      performance.mark('baz', {startTime: 20});
      performance.mark('bar', {startTime: 30});
      performance.mark('foo', {startTime: 10});

      performance.mark('foo', {startTime: 50}); // again

      performance.measure('bar', {start: 20, duration: 40});
      performance.measure('foo', {start: 10, duration: 40});

      performance.clearMarks('foo');

      expect(toJSON(performance.getEntries())).toEqual([
        {
          duration: 40,
          entryType: 'measure',
          name: 'foo',
          startTime: 10,
        },
        {
          duration: 0,
          entryType: 'mark',
          name: 'baz',
          startTime: 20,
        },
        {
          duration: 40,
          entryType: 'measure',
          name: 'bar',
          startTime: 20,
        },
        {
          duration: 0,
          entryType: 'mark',
          name: 'bar',
          startTime: 30,
        },
      ]);

      expect(toJSON(performance.getEntriesByType('mark'))).toEqual([
        {
          duration: 0,
          entryType: 'mark',
          name: 'baz',
          startTime: 20,
        },
        {
          duration: 0,
          entryType: 'mark',
          name: 'bar',
          startTime: 30,
        },
      ]);

      expect(toJSON(performance.getEntriesByName('foo'))).toEqual([
        {
          duration: 40,
          entryType: 'measure',
          name: 'foo',
          startTime: 10,
        },
      ]);

      performance.clearMeasures('bar');

      expect(toJSON(performance.getEntries())).toEqual([
        {
          duration: 40,
          entryType: 'measure',
          name: 'foo',
          startTime: 10,
        },
        {
          duration: 0,
          entryType: 'mark',
          name: 'baz',
          startTime: 20,
        },
        {
          duration: 0,
          entryType: 'mark',
          name: 'bar',
          startTime: 30,
        },
      ]);

      expect(toJSON(performance.getEntriesByType('measure'))).toEqual([
        {
          duration: 40,
          entryType: 'measure',
          name: 'foo',
          startTime: 10,
        },
      ]);

      expect(toJSON(performance.getEntriesByName('bar'))).toEqual([
        {
          duration: 0,
          entryType: 'mark',
          name: 'bar',
          startTime: 30,
        },
      ]);

      performance.clearMarks();

      expect(toJSON(performance.getEntries())).toEqual([
        {
          duration: 40,
          entryType: 'measure',
          name: 'foo',
          startTime: 10,
        },
      ]);

      expect(toJSON(performance.getEntriesByType('mark'))).toEqual([]);

      performance.clearMeasures();

      expect(toJSON(performance.getEntries())).toEqual([]);

      expect(toJSON(performance.getEntriesByType('measure'))).toEqual([]);
    });

    it('handles consecutive adding and clearing (marks)', () => {
      performance.mark('foo', {startTime: 10});
      performance.mark('foo', {startTime: 20});

      expect(toJSON(performance.getEntries())).toEqual([
        {
          duration: 0,
          entryType: 'mark',
          name: 'foo',
          startTime: 10,
        },
        {
          duration: 0,
          entryType: 'mark',
          name: 'foo',
          startTime: 20,
        },
      ]);

      performance.clearMarks();

      expect(toJSON(performance.getEntries())).toEqual([]);

      performance.mark('foo', {startTime: 30});

      expect(toJSON(performance.getEntries())).toEqual([
        {
          duration: 0,
          entryType: 'mark',
          name: 'foo',
          startTime: 30,
        },
      ]);

      performance.clearMarks();

      expect(toJSON(performance.getEntries())).toEqual([]);
    });

    it('handles consecutive adding and clearing (measures)', () => {
      performance.measure('foo', {start: 10, end: 20});
      performance.measure('foo', {start: 20, end: 30});

      expect(toJSON(performance.getEntries())).toEqual([
        {
          duration: 10,
          entryType: 'measure',
          name: 'foo',
          startTime: 10,
        },
        {
          duration: 10,
          entryType: 'measure',
          name: 'foo',
          startTime: 20,
        },
      ]);

      performance.clearMeasures();

      expect(toJSON(performance.getEntries())).toEqual([]);

      performance.measure('foo', {start: 30, end: 40});

      expect(toJSON(performance.getEntries())).toEqual([
        {
          duration: 10,
          entryType: 'measure',
          name: 'foo',
          startTime: 30,
        },
      ]);

      performance.clearMeasures();

      expect(toJSON(performance.getEntries())).toEqual([]);
    });
  });
});
