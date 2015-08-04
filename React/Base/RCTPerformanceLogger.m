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

static int64_t RCTPLData[RCTPLSize][2] = {};

void RCTPerformanceLoggerStart(RCTPLTag tag)
{
  RCTPLData[tag][0] = CACurrentMediaTime() * 1000;
}

void RCTPerformanceLoggerEnd(RCTPLTag tag)
{
  RCTPLData[tag][1] = CACurrentMediaTime() * 1000;
}

NSArray *RCTPerformanceLoggerOutput(void)
{
  return @[
    @(RCTPLData[0][0]),
    @(RCTPLData[0][1]),
    @(RCTPLData[1][0]),
    @(RCTPLData[1][1]),
    @(RCTPLData[2][0]),
    @(RCTPLData[2][1]),
  ];
}

@interface RCTPerformanceLogger : NSObject <RCTBridgeModule>

@end

@implementation RCTPerformanceLogger

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (instancetype)init
{
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(sendTimespans)
                                                 name:RCTContentDidAppearNotification
                                               object:nil];
  }
  return self;
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
    @[
      @"ScriptDownload",
      @"ScriptExecution",
      @"TTI",
    ],
  ]];
}

@end
