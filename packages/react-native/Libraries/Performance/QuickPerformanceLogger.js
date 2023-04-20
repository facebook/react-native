/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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

// Defines map of annotations
// Use as following:
// {string: {key1: value1, key2: value2}}
export type AnnotationsMap = Partial<{
  string: ?{[string]: string, ...},
  int: ?{[string]: number, ...},
  double: ?{[string]: number, ...},
  bool: ?{[string]: boolean, ...},
  string_array: ?{[string]: $ReadOnlyArray<string>, ...},
  int_array: ?{[string]: $ReadOnlyArray<number>, ...},
  double_array: ?{[string]: $ReadOnlyArray<number>, ...},
  bool_array: ?{[string]: $ReadOnlyArray<boolean>, ...},
}>;

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
    annotations: AnnotationsMap,
    instanceKey: number = DUMMY_INSTANCE_KEY,
  ): void {
    if (global.nativeQPLMarkerAnnotateWithMap) {
      global.nativeQPLMarkerAnnotateWithMap(markerId, annotations, instanceKey);
    } else if (global.nativeQPLMarkerAnnotate) {
      for (const type of [
        'string',
        'int',
        'double',
        'bool',
        'string_array',
        'int_array',
        'double_array',
        'bool_array',
      ]) {
        const keyValsOfType = annotations[type];
        if (keyValsOfType != null) {
          for (const annotationKey of Object.keys(keyValsOfType)) {
            global.nativeQPLMarkerAnnotate(
              markerId,
              instanceKey,
              annotationKey,
              keyValsOfType[annotationKey].toString(),
            );
          }
        }
      }
    }
  },

  markerCancel(
    markerId: number,
    instanceKey?: number = DUMMY_INSTANCE_KEY,
  ): void {
    // $FlowFixMe[object-this-reference]
    this.markerDrop(markerId, instanceKey);
  },

  markerPoint(
    markerId: number,
    name: string,
    instanceKey: number = DUMMY_INSTANCE_KEY,
    timestamp: number = AUTO_SET_TIMESTAMP,
    data: ?string = null,
  ): void {
    if (global.nativeQPLMarkerPoint) {
      global.nativeQPLMarkerPoint(markerId, name, instanceKey, timestamp, data);
    }
  },

  markerDrop(
    markerId: number,
    instanceKey?: number = DUMMY_INSTANCE_KEY,
  ): void {
    if (global.nativeQPLMarkerDrop) {
      global.nativeQPLMarkerDrop(markerId, instanceKey);
    }
  },

  markEvent(
    markerId: number,
    type: string,
    annotations: ?AnnotationsMap = null,
  ): void {
    if (global.nativeQPLMarkEvent) {
      global.nativeQPLMarkEvent(markerId, type, annotations);
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
