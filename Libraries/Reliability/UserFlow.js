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

type FlowId = {
  markerId: number,
  instanceKey: number,
};

/**
 * API for tracking reliability of your user interactions
 *
 * Example:
 * var flowId = UserFlow.newFlowId(QuickLogItentifiersExample.EXAMPLE_EVENT);
 * UserFlow.start(flowId, "user_click");
 * ...
 * UserFlow.completeWithSuccess(flowId);
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

  annotate(
    flowId: FlowId,
    annotationName: string,
    annotationValue: string,
  ): void {
    if (global.nativeUserFlowAnnotate) {
      global.nativeUserFlowAnnotate(
        flowId.markerId,
        flowId.instanceKey,
        annotationName,
        annotationValue,
      );
    }
  },

  markPoint(flowId: FlowId, pointName: string): void {
    if (global.nativeUserFlowMarkPoint) {
      global.nativeUserFlowMarkPoint(
        flowId.markerId,
        flowId.instanceKey,
        pointName,
      );
    }
  },

  completeWithSuccess(flowId: FlowId): void {
    if (global.nativeUserFlowCompleteWithSuccess) {
      global.nativeUserFlowCompleteWithSuccess(
        flowId.markerId,
        flowId.instanceKey,
      );
    }
  },

  completeWithUnexpectedFail(
    flowId: FlowId,
    reason: string,
    failureLocation: string,
  ): void {
    if (global.nativeUserFlowCompleteWithUnexpectedFail) {
      global.nativeUserFlowCompleteWithUnexpectedFail(
        flowId.markerId,
        flowId.instanceKey,
        reason,
        failureLocation,
      );
    }
  },

  completeWithExpectedFail(
    flowId: FlowId,
    reason: string,
    failureLocation: string,
  ): void {
    if (global.nativeUserFlowCompleteWithExpectedFail) {
      global.nativeUserFlowCompleteWithExpectedFail(
        flowId.markerId,
        flowId.instanceKey,
        reason,
        failureLocation,
      );
    }
  },

  cancel(flowId: FlowId, cancelReason: string): void {
    if (global.nativeUserFlowCancel) {
      global.nativeUserFlowCancel(
        flowId.markerId,
        flowId.instanceKey,
        cancelReason,
      );
    }
  },
};

module.exports = UserFlow;
