/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 * @fantom_flags enableLongTaskAPI:true
 */

import setUpPerformanceObserver from '../../../setup/setUpPerformanceObserver';
import ensureInstance from '../../../utilities/ensureInstance';
import {PerformanceMark} from '../UserTiming';
import {runWorkLoop} from '@react-native/fantom';

import '../../../../../Libraries/Core/InitializeCore.js';

setUpPerformanceObserver();

describe('User Timing API', () => {
  describe('performance.mark()', () => {
    it('reports marks to observers', () => {
      const callback = jest.fn();

      const observer = new PerformanceObserver(callback);
      observer.observe({type: 'mark'});

      expect(callback).not.toHaveBeenCalled();

      const mark1Detail = Symbol('mark1Detail');
      performance.mark('mark1', {
        startTime: 100,
        detail: mark1Detail,
      });

      const mark2Detail = Symbol('mark2Detail');
      performance.mark('mark2', {
        startTime: 200,
        detail: mark2Detail,
      });

      expect(callback).not.toHaveBeenCalled();

      runWorkLoop();

      expect(callback).toHaveBeenCalledTimes(1);

      const entries = callback.mock.lastCall[0].getEntries();
      expect(entries.length).toBe(2);

      const mark1 = ensureInstance(entries[0], PerformanceMark);
      const mark2 = ensureInstance(entries[1], PerformanceMark);

      expect(mark1.entryType).toBe('mark');
      expect(mark1.name).toBe('mark1');
      expect(mark1.startTime).toBe(100);
      expect(mark1.duration).toBe(0);
      // This doesn't work through PerformanceObserver yet
      // expect(mark1.detail).toBe(mark1Detail);

      expect(mark2.entryType).toBe('mark');
      expect(mark2.name).toBe('mark2');
      expect(mark2.startTime).toBe(200);
      expect(mark2.duration).toBe(0);
      // This doesn't work through PerformanceObserver yet
      // expect(mark2.detail).toBe(mark2Detail);
    });
  });
});
