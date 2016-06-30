/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <QuartzCore/QuartzCore.h>

#import "RCTPerformanceLogger.h"
#import "RCTRootView.h"
#import "RCTLog.h"
#import "RCTProfile.h"

static int64_t RCTPLData[RCTPLSize][2] = {};
static NSUInteger RCTPLCookies[RCTPLSize] = {};

void RCTPerformanceLoggerStart(RCTPLTag tag)
{
  if (RCTProfileIsProfiling()) {
    NSString *label = RCTPerformanceLoggerLabels()[tag];
    RCTPLCookies[tag] = RCTProfileBeginAsyncEvent(RCTProfileTagAlways, label, nil);
  }

  RCTPLData[tag][0] = CACurrentMediaTime() * 1000;
  RCTPLData[tag][1] = 0;
}

void RCTPerformanceLoggerEnd(RCTPLTag tag)
{
  if (RCTPLData[tag][0] != 0 && RCTPLData[tag][1] == 0) {
    RCTPLData[tag][1] = CACurrentMediaTime() * 1000;

    if (RCTProfileIsProfiling()) {
      NSString *label = RCTPerformanceLoggerLabels()[tag];
      RCTProfileEndAsyncEvent(RCTProfileTagAlways, @"native", RCTPLCookies[tag], label, @"RCTPerformanceLogger", nil);
    }
  } else {
    RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

void RCTPerformanceLoggerSet(RCTPLTag tag, int64_t value)
{
  RCTPLData[tag][0] = 0;
  RCTPLData[tag][1] = value;
}

void RCTPerformanceLoggerAdd(RCTPLTag tag, int64_t value)
{
  RCTPLData[tag][0] = 0;
  RCTPLData[tag][1] += value;
}

void RCTPerformanceLoggerAppendStart(RCTPLTag tag)
{
  RCTPLData[tag][0] = CACurrentMediaTime() * 1000;
}

void RCTPerformanceLoggerAppendEnd(RCTPLTag tag)
{
  if (RCTPLData[tag][0] != 0) {
    RCTPLData[tag][1] += CACurrentMediaTime() * 1000 - RCTPLData[tag][0];
    RCTPLData[tag][0] = 0;
  } else {
    RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

NSArray<NSNumber *> *RCTPerformanceLoggerOutput(void)
{
  NSMutableArray *result = [NSMutableArray array];
  for (NSUInteger index = 0; index < RCTPLSize; index++) {
    [result addObject:@(RCTPLData[index][0])];
    [result addObject:@(RCTPLData[index][1])];
  }
  return result;
}

NSArray *RCTPerformanceLoggerLabels(void)
{
  static NSArray *labels;
  static dispatch_once_t token;
  dispatch_once(&token, ^{
    labels = @[
      @"ScriptDownload",
      @"ScriptExecution",
      @"RAMBundleLoad",
      @"RAMStartupCodeSize",
      @"RAMNativeRequires",
      @"RAMNativeRequiresCount",
      @"RAMNativeRequiresSize",
      @"NativeModuleInit",
      @"NativeModuleMainThread",
      @"NativeModulePrepareConfig",
      @"NativeModuleInjectConfig",
      @"NativeModuleMainThreadUsesCount",
      @"JSCWrapperOpenLibrary",
      @"JSCWrapperLoadFunctions",
      @"JSCExecutorSetup",
      @"BridgeStartup",
      @"RootViewTTI",
      @"BundleSize",
    ];
  });
  return labels;
}

@interface RCTPerformanceLogger : NSObject <RCTBridgeModule>

@end

@implementation RCTPerformanceLogger

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (instancetype)init
{
  // We're only overriding this to ensure the module gets created at startup
  // TODO (t11106126): Remove once we have more declarative control over module setup.
  return [super init];
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(sendTimespans)
                                               name:RCTContentDidAppearNotification
                                             object:nil];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)sendTimespans
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];

  [_bridge enqueueJSCall:@"PerformanceLogger.addTimespans" args:@[
    RCTPerformanceLoggerOutput(),
    RCTPerformanceLoggerLabels(),
  ]];
}

@end
