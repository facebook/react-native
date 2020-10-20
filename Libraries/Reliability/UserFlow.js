/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

const AUTO_INSTANCE_KEY = -1;

export type FlowId = {
  markerId: number,
  instanceKey: number,
};

export type PointData = $Shape<{
  string: ?{[string]: string, ...},
  int: ?{[string]: number, ...},
  double: ?{[string]: number, ...},
  bool: ?{[string]: boolean, ...},
  string_array: ?{[string]: $ReadOnlyArray<string>, ...},
  int_array: ?{[string]: $ReadOnlyArray<number>, ...},
  double_array: ?{[string]: $ReadOnlyArray<number>, ...},
  bool_array: ?{[string]: $ReadOnlyArray<boolean>, ...},
}>;

/**
 * API for tracking reliability of your user interactions
 *
 * Example:
 * const flowId = UserFlow.newFlowId(QuickLogItentifiersExample.EXAMPLE_EVENT);
 * ...
 * UserFlow.start(flowId, "user_click");
 * ...
 * UserFlow.addAnnotation(flowId, "cached", "true");
 * ...
 * UserFlow.addPoint(flowId, "reload");
 * ...
 * UserFlow.endSuccess(flowId);
 */
const UserFlow = {
  /**
   * Creates FlowId from markerId and instanceKey.
   * You will pass FlowId in every other method of UserFlow API.
   *
   * By default, instanceKey will generate unique instance every time you call userFlowGetId with markerId only.
   */
  newFlowId(markerId: number, instanceKey: number = AUTO_INSTANCE_KEY): FlowId {
    var resolvedInstanceKey = instanceKey;
    if (instanceKey === AUTO_INSTANCE_KEY) {
      if (global.nativeUserFlowNextInstanceKey) {
        resolvedInstanceKey = global.nativeUserFlowNextInstanceKey();
      } else {
        // There is no JSI methods installed, API won't do anything
        resolvedInstanceKey = 0;
      }
    }
    return {
      markerId: markerId,
      instanceKey: resolvedInstanceKey,
    };
  },

  start(flowId: FlowId, triggerSource: string): void {
    if (global.nativeUserFlowStart) {
      global.nativeUserFlowStart(
        flowId.markerId,
        flowId.instanceKey,
        triggerSource,
      );
    }
  },

  addAnnotation(
    flowId: FlowId,
    annotationName: string,
    annotationValue: string | boolean,
  ): void {
    if (global.nativeUserFlowAddAnnotation) {
      global.nativeUserFlowAddAnnotation(
        flowId.markerId,
        flowId.instanceKey,
        annotationName,
        annotationValue,
      );
    }
  },

  addPoint(flowId: FlowId, pointName: string, data: ?PointData = null): void {
    if (global.nativeUserFlowAddPoint) {
      global.nativeUserFlowAddPoint(
        flowId.markerId,
        flowId.instanceKey,
        pointName,
        data,
      );
    }
  },

  endSuccess(flowId: FlowId): void {
    if (global.nativeUserFlowEndSuccess) {
      global.nativeUserFlowEndSuccess(flowId.markerId, flowId.instanceKey);
    }
  },

  endFailure(
    flowId: FlowId,
    errorName: string,
    debugInfo: ?string = null,
  ): void {
    if (global.nativeUserFlowEndFail) {
      global.nativeUserFlowEndFail(
        flowId.markerId,
        flowId.instanceKey,
        errorName,
        debugInfo,
      );
    }
  },

  endCancel(flowId: FlowId, cancelReason: string): void {
    if (global.nativeUserFlowEndCancel) {
      global.nativeUserFlowEndCancel(
        flowId.markerId,
        flowId.instanceKey,
        cancelReason,
      );
    }
  },
};

module.exports = UserFlow;
