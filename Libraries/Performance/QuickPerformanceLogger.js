/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

const AUTO_SET_TIMESTAMP = -1;
const DUMMY_INSTANCE_KEY = 0;

const QuickPerformanceLogger = {
  markerStart(
    markerId: number,
    instanceKey: number = DUMMY_INSTANCE_KEY,
    timestamp: number = AUTO_SET_TIMESTAMP,
  ): void {
    if (global.nativeQPLMarkerStart) {
      global.nativeQPLMarkerStart(markerId, instanceKey, timestamp);
    }
  },

  markerEnd(
    markerId: number,
    actionId: number,
    instanceKey: number = DUMMY_INSTANCE_KEY,
    timestamp: number = AUTO_SET_TIMESTAMP,
  ): void {
    if (global.nativeQPLMarkerEnd) {
      global.nativeQPLMarkerEnd(markerId, instanceKey, actionId, timestamp);
    }
  },

  markerNote(
    markerId: number,
    actionId: number,
    instanceKey: number = DUMMY_INSTANCE_KEY,
    timestamp: number = AUTO_SET_TIMESTAMP,
  ): void {
    if (global.nativeQPLMarkerNote) {
      global.nativeQPLMarkerNote(markerId, instanceKey, actionId, timestamp);
    }
  },

  markerTag(
    markerId: number,
    tag: string,
    instanceKey: number = DUMMY_INSTANCE_KEY,
  ): void {
    if (global.nativeQPLMarkerTag) {
      global.nativeQPLMarkerTag(markerId, instanceKey, tag);
    }
  },

  markerAnnotate(
    markerId: number,
    annotationKey: string,
    annotationValue: string,
    instanceKey: number = DUMMY_INSTANCE_KEY,
  ): void {
    if (global.nativeQPLMarkerAnnotate) {
      global.nativeQPLMarkerAnnotate(
        markerId,
        instanceKey,
        annotationKey,
        annotationValue,
      );
    }
  },

  markerCancel(
    markerId: number,
    instanceKey?: number = DUMMY_INSTANCE_KEY,
  ): void {
    if (global.nativeQPLMarkerCancel) {
      global.nativeQPLMarkerCancel(markerId, instanceKey);
    }
  },

  markerPoint(
    markerId: number,
    name: string,
    instanceKey: number = DUMMY_INSTANCE_KEY,
    timestamp: number = AUTO_SET_TIMESTAMP,
  ): void {
    if (global.nativeQPLMarkerPoint) {
      global.nativeQPLMarkerPoint(markerId, name, instanceKey, timestamp);
    }
  },

  currentTimestamp(): number {
    if (global.nativeQPLTimestamp) {
      return global.nativeQPLTimestamp();
    }
    return 0;
  },
};

module.exports = QuickPerformanceLogger;
