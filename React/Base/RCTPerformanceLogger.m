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
    RCTPLCookies[tag] = RCTProfileBeginAsyncEvent(0, label, nil);
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
      RCTProfileEndAsyncEvent(0, @"native", RCTPLCookies[tag], label, @"RCTPerformanceLogger", nil);
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
  return @[
    @(RCTPLData[RCTPLScriptDownload][0]),
    @(RCTPLData[RCTPLScriptDownload][1]),
    @(RCTPLData[RCTPLScriptExecution][0]),
    @(RCTPLData[RCTPLScriptExecution][1]),
    @(RCTPLData[RCTPLNativeModuleInit][0]),
    @(RCTPLData[RCTPLNativeModuleInit][1]),
    @(RCTPLData[RCTPLNativeModuleMainThread][0]),
    @(RCTPLData[RCTPLNativeModuleMainThread][1]),
    @(RCTPLData[RCTPLNativeModulePrepareConfig][0]),
    @(RCTPLData[RCTPLNativeModulePrepareConfig][1]),
    @(RCTPLData[RCTPLNativeModuleInjectConfig][0]),
    @(RCTPLData[RCTPLNativeModuleInjectConfig][1]),
    @(RCTPLData[RCTPLNativeModuleMainThreadUsesCount][0]),
    @(RCTPLData[RCTPLNativeModuleMainThreadUsesCount][1]),
    @(RCTPLData[RCTPLJSCExecutorSetup][0]),
    @(RCTPLData[RCTPLJSCExecutorSetup][1]),
    @(RCTPLData[RCTPLTTI][0]),
    @(RCTPLData[RCTPLTTI][1]),
    @(RCTPLData[RCTPLBundleSize][0]),
    @(RCTPLData[RCTPLBundleSize][1]),
  ];
}

NSArray *RCTPerformanceLoggerLabels(void)
{
  static NSArray *labels;
  static dispatch_once_t token;
  dispatch_once(&token, ^{
    labels = @[
      @"ScriptDownload",
      @"ScriptExecution",
      @"NativeModuleInit",
      @"NativeModuleMainThread",
      @"NativeModulePrepareConfig",
      @"NativeModuleInjectConfig",
      @"NativeModuleMainThreadUsesCount",
      @"JSCExecutorSetup",
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
