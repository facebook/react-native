/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {polyfillGlobal} from '../Utilities/PolyfillFunctions';

polyfillGlobal(
  'PerformanceObserver',
  () =>
    require('../../src/private/webapis/performance/PerformanceObserver')
      .default,
);

polyfillGlobal(
  'PerformanceObserverEntryList',
  () =>
    require('../../src/private/webapis/performance/PerformanceObserver')
      .PerformanceObserverEntryList,
);

polyfillGlobal(
  'PerformanceEntry',
  () =>
    require('../../src/private/webapis/performance/PerformanceEntry')
      .PerformanceEntry,
);

polyfillGlobal(
  'PerformanceMark',
  () =>
    require('../../src/private/webapis/performance/UserTiming').PerformanceMark,
);

polyfillGlobal(
  'PerformanceMeasure',
  () =>
    require('../../src/private/webapis/performance/UserTiming')
      .PerformanceMeasure,
);

polyfillGlobal(
  'PerformanceEventTiming',
  () =>
    require('../../src/private/webapis/performance/EventTiming')
      .PerformanceEventTiming,
);

polyfillGlobal(
  'TaskAttributionTiming',
  () =>
    require('../../src/private/webapis/performance/LongTasks')
      .TaskAttributionTiming,
);

polyfillGlobal(
  'PerformanceLongTaskTiming',
  () =>
    require('../../src/private/webapis/performance/LongTasks')
      .PerformanceLongTaskTiming,
);
