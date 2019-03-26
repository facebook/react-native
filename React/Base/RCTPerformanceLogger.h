/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSUInteger, RCTPLTag) {
  RCTPLScriptDownload = 0,
  RCTPLScriptExecution,
  RCTPLRAMBundleLoad,
  RCTPLRAMStartupCodeSize,
  RCTPLRAMStartupNativeRequires,
  RCTPLRAMStartupNativeRequiresCount,
  RCTPLRAMNativeRequires,
  RCTPLRAMNativeRequiresCount,
  RCTPLNativeModuleInit,
  RCTPLNativeModuleMainThread,
  RCTPLNativeModulePrepareConfig,
  RCTPLNativeModuleInjectConfig,
  RCTPLNativeModuleMainThreadUsesCount,
  RCTPLJSCWrapperOpenLibrary,
  RCTPLJSCExecutorSetup,
  RCTPLBridgeStartup,
  RCTPLTTI,
  RCTPLBundleSize,
  RCTPLSize
};

@interface RCTPerformanceLogger : NSObject

/**
 * Starts measuring a metric with the given tag.
 * Overrides previous value if the measurement has been already started.
 * If RCTProfile is enabled it also begins appropriate async event.
 * All work is scheduled on the background queue so this doesn't block current thread.
 */
- (void)markStartForTag:(RCTPLTag)tag;

/**
 * Stops measuring a metric with given tag.
 * Checks if RCTPerformanceLoggerStart() has been called before
 * and doesn't do anything and log a message if it hasn't.
 * If RCTProfile is enabled it also ends appropriate async event.
 * All work is scheduled on the background queue so this doesn't block current thread.
 */
- (void)markStopForTag:(RCTPLTag)tag;

/**
 * Sets given value for a metric with given tag.
 * All work is scheduled on the background queue so this doesn't block current thread.
 */
- (void)setValue:(int64_t)value forTag:(RCTPLTag)tag;

/**
 * Adds given value to the current value for a metric with given tag.
 * All work is scheduled on the background queue so this doesn't block current thread.
 */
- (void)addValue:(int64_t)value forTag:(RCTPLTag)tag;

/**
 * Starts an additional measurement for a metric with given tag.
 * It doesn't override previous measurement, instead it'll append a new value
 * to the old one.
 * All work is scheduled on the background queue so this doesn't block current thread.
 */
- (void)appendStartForTag:(RCTPLTag)tag;

/**
 * Stops measurement and appends the result to the metric with given tag.
 * Checks if RCTPerformanceLoggerAppendStart() has been called before
 * and doesn't do anything and log a message if it hasn't.
 * All work is scheduled on the background queue so this doesn't block current thread.
 */
- (void)appendStopForTag:(RCTPLTag)tag;

/**
 * Returns an array with values for all tags.
 * Use RCTPLTag to go over the array, there's a pair of values
 * for each tag: start and stop (with indexes 2 * tag and 2 * tag + 1).
 */
- (NSArray<NSNumber *> *)valuesForTags;

/**
 * Returns a duration in ms (stop_time - start_time) for given RCTPLTag.
 */
- (int64_t)durationForTag:(RCTPLTag)tag;

/**
 * Returns a value for given RCTPLTag.
 */
- (int64_t)valueForTag:(RCTPLTag)tag;

/**
 * Returns an array with values for all tags.
 * Use RCTPLTag to go over the array.
 */
- (NSArray<NSString *> *)labelsForTags;

@end
