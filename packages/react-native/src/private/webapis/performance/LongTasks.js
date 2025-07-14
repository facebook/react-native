/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// flowlint unsafe-getters-setters:off

import type {PerformanceEntryJSON} from './PerformanceEntry';

import {PerformanceEntry} from './PerformanceEntry';

export type PerformanceLongTaskTimingJSON = {
  ...PerformanceEntryJSON,
  attribution: $ReadOnlyArray<TaskAttributionTiming>,
  ...
};

export class TaskAttributionTiming extends PerformanceEntry {}

const EMPTY_ATTRIBUTION: $ReadOnlyArray<TaskAttributionTiming> =
  Object.preventExtensions([]);

export class PerformanceLongTaskTiming extends PerformanceEntry {
  get attribution(): $ReadOnlyArray<TaskAttributionTiming> {
    return EMPTY_ATTRIBUTION;
  }

  toJSON(): PerformanceLongTaskTimingJSON {
    return {
      ...super.toJSON(),
      attribution: this.attribution,
    };
  }
}
