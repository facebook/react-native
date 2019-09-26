/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

import GlobalPerformanceLogger from '../GlobalPerformanceLogger';
import createPerformanceLogger from '../createPerformanceLogger';
import type {IPerformanceLogger} from '../createPerformanceLogger';

const TIMESPAN_1 = '<timespan_1>';
const TIMESPAN_2 = '<timespan_2>';
const TIMESPAN_2_DURATION = 123;
const EXTRA_KEY = '<extra_key>';
const EXTRA_VALUE = '<extra_value>';
const EXTRA_VALUE_2 = '<extra_value_2>';
const POINT = '<point>';
const POINT_TIMESTAMP = 99;
const POINT_TIMESTAMP_2 = 999;

describe('PerformanceLogger', () => {
  beforeEach(() => {
    GlobalPerformanceLogger.clear();
  });

  it('starts & stops and adds a timespan', () => {
    let perfLogger = createPerformanceLogger();
    perfLogger.startTimespan(TIMESPAN_1);
    perfLogger.stopTimespan(TIMESPAN_1);
    perfLogger.addTimespan(TIMESPAN_2, TIMESPAN_2_DURATION);
    expect(perfLogger.hasTimespan(TIMESPAN_1)).toBe(true);
    expect(perfLogger.hasTimespan(TIMESPAN_2)).toBe(true);
    expect(perfLogger.getTimespans()[TIMESPAN_2].totalTime).toBe(
      TIMESPAN_2_DURATION,
    );
  });

  it('does not override a timespan', () => {
    let perfLogger = createPerformanceLogger();
    perfLogger.startTimespan(TIMESPAN_1);
    let old = perfLogger.getTimespans()[TIMESPAN_1];
    perfLogger.startTimespan(TIMESPAN_1);
    expect(perfLogger.getTimespans()[TIMESPAN_1]).toBe(old);
    perfLogger.addTimespan(TIMESPAN_1, 1);
    expect(perfLogger.getTimespans()[TIMESPAN_1]).toBe(old);
  });

  it('logs an extra', () => {
    let perfLogger = createPerformanceLogger();
    perfLogger.setExtra(EXTRA_KEY, EXTRA_VALUE);
    expect(perfLogger.getExtras()).toEqual({
      [EXTRA_KEY]: EXTRA_VALUE,
    });
  });

  it('does not override a extra', () => {
    let perfLogger = createPerformanceLogger();
    perfLogger.setExtra(EXTRA_KEY, EXTRA_VALUE);
    expect(perfLogger.getExtras()).toEqual({
      [EXTRA_KEY]: EXTRA_VALUE,
    });
    perfLogger.setExtra(EXTRA_KEY, EXTRA_VALUE_2);
    expect(perfLogger.getExtras()).toEqual({
      [EXTRA_KEY]: EXTRA_VALUE,
    });
  });

  it('removes an extra', () => {
    let perfLogger = createPerformanceLogger();
    perfLogger.setExtra(EXTRA_KEY, EXTRA_VALUE);
    expect(perfLogger.getExtras()).toEqual({
      [EXTRA_KEY]: EXTRA_VALUE,
    });
    expect(perfLogger.removeExtra(EXTRA_KEY)).toEqual(EXTRA_VALUE);
    expect(perfLogger.getExtras()).toEqual({});
  });

  it('logs a point', () => {
    let perfLogger = createPerformanceLogger();
    perfLogger.markPoint(POINT, POINT_TIMESTAMP);
    expect(perfLogger.getPoints()).toEqual({
      [POINT]: POINT_TIMESTAMP,
    });
  });

  it('does not override a point', () => {
    let perfLogger = createPerformanceLogger();
    perfLogger.markPoint(POINT, POINT_TIMESTAMP);
    expect(perfLogger.getPoints()).toEqual({
      [POINT]: POINT_TIMESTAMP,
    });
    perfLogger.markPoint(POINT, POINT_TIMESTAMP_2);
    expect(perfLogger.getPoints()).toEqual({
      [POINT]: POINT_TIMESTAMP,
    });
  });

  it('global and local loggers do not conflict', () => {
    let checkLogger = (logger: IPerformanceLogger, shouldBeEmpty: boolean) => {
      expect(Object.keys(logger.getTimespans())).toEqual(
        shouldBeEmpty ? [] : [TIMESPAN_1],
      );
      expect(logger.getExtras()).toEqual(
        shouldBeEmpty
          ? {}
          : {
              [EXTRA_KEY]: EXTRA_VALUE,
            },
      );
      expect(Object.keys(logger.getPoints())).toEqual(
        shouldBeEmpty ? [] : [POINT],
      );
    };
    let localPerformanceLogger1 = createPerformanceLogger();
    let localPerformanceLogger2 = createPerformanceLogger();
    localPerformanceLogger1.startTimespan(TIMESPAN_1);
    localPerformanceLogger1.stopTimespan(TIMESPAN_1);
    localPerformanceLogger1.setExtra(EXTRA_KEY, EXTRA_VALUE);
    localPerformanceLogger1.markPoint(POINT);
    checkLogger(localPerformanceLogger1, false);
    checkLogger(localPerformanceLogger2, true);
    checkLogger(GlobalPerformanceLogger, true);
    localPerformanceLogger2.startTimespan(TIMESPAN_1);
    localPerformanceLogger2.stopTimespan(TIMESPAN_1);
    localPerformanceLogger2.setExtra(EXTRA_KEY, EXTRA_VALUE);
    localPerformanceLogger2.markPoint(POINT, undefined);
    checkLogger(localPerformanceLogger2, false);
    checkLogger(GlobalPerformanceLogger, true);
    GlobalPerformanceLogger.startTimespan(TIMESPAN_1);
    GlobalPerformanceLogger.stopTimespan(TIMESPAN_1);
    GlobalPerformanceLogger.setExtra(EXTRA_KEY, EXTRA_VALUE);
    GlobalPerformanceLogger.markPoint(POINT);
    checkLogger(GlobalPerformanceLogger, false);
    localPerformanceLogger1.clear();
    checkLogger(localPerformanceLogger1, true);
    checkLogger(localPerformanceLogger2, false);
    checkLogger(GlobalPerformanceLogger, false);
    GlobalPerformanceLogger.clear();
    checkLogger(localPerformanceLogger1, true);
    checkLogger(localPerformanceLogger2, false);
    checkLogger(GlobalPerformanceLogger, true);
    localPerformanceLogger2.clear();
    checkLogger(localPerformanceLogger1, true);
    checkLogger(localPerformanceLogger2, true);
    checkLogger(GlobalPerformanceLogger, true);
  });
});
