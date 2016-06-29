/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTDefines.h"

typedef NS_ENUM(NSUInteger, RCTPLTag) {
  RCTPLScriptDownload = 0,
  RCTPLScriptExecution,
  RCTPLRAMBundleLoad,
  RCTPLRAMStartupCodeSize,
  RCTPLRAMNativeRequires,
  RCTPLRAMNativeRequiresCount,
  RCTPLRAMNativeRequiresSize,
  RCTPLNativeModuleInit,
  RCTPLNativeModuleMainThread,
  RCTPLNativeModulePrepareConfig,
  RCTPLNativeModuleInjectConfig,
  RCTPLNativeModuleMainThreadUsesCount,
  RCTPLJSCExecutorSetup,
  RCTPLBridgeStartup,
  RCTPLTTI,
  RCTPLBundleSize,
  RCTPLSize
};

/**
 * Starts measuring a metric with the given tag.
 * Overrides previous value if the measurement has been already started.
 * If RCTProfile is enabled it also begins appropriate async event.
 */
RCT_EXTERN void RCTPerformanceLoggerStart(RCTPLTag tag);

/**
 * Stops measuring a metric with given tag.
 * Checks if RCTPerformanceLoggerStart() has been called before
 * and doesn't do anything and log a message if it hasn't.
 * If RCTProfile is enabled it also ends appropriate async event.
 */
RCT_EXTERN void RCTPerformanceLoggerEnd(RCTPLTag tag);

/**
 * Sets given value for a metric with given tag.
 */
RCT_EXTERN void RCTPerformanceLoggerSet(RCTPLTag tag, int64_t value);

/**
 * Adds given value to the current value for a metric with given tag.
 */
RCT_EXTERN void RCTPerformanceLoggerAdd(RCTPLTag tag, int64_t value);

/**
 * Starts an additional measurement for a metric with given tag.
 * It doesn't override previous measurement, instead it'll append a new value
 * to the old one.
 */
RCT_EXTERN void RCTPerformanceLoggerAppendStart(RCTPLTag tag);

/**
 * Stops measurement and appends the result to the metric with given tag.
 * Checks if RCTPerformanceLoggerAppendStart() has been called before
 * and doesn't do anything and log a message if it hasn't.
 */
RCT_EXTERN void RCTPerformanceLoggerAppendEnd(RCTPLTag tag);

RCT_EXTERN NSArray<NSNumber *> *RCTPerformanceLoggerOutput(void);
RCT_EXTERN NSArray *RCTPerformanceLoggerLabels(void);
