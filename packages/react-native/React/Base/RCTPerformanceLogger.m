/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>

#import "RCTLog.h"
#import "RCTPerformanceLogger.h"
#import "RCTPerformanceLoggerLabels.h"
#import "RCTProfile.h"
#import "RCTRootView.h"

@interface RCTPerformanceLogger () {
  int64_t _data[RCTPLSize][2];
  NSInteger _cookies[RCTPLSize];
}

@end

@implementation RCTPerformanceLogger

- (void)markStartForTag:(RCTPLTag)tag
{
#if RCT_PROFILE
  if (RCTProfileIsProfiling()) {
    NSString *label = RCTPLLabelForTag(tag);
    _cookies[tag] = RCTProfileBeginAsyncEvent(RCTProfileTagAlways, label, nil);
  }
#endif
  _data[tag][0] = CACurrentMediaTime() * 1000;
  _data[tag][1] = 0;
}

- (void)markStopForTag:(RCTPLTag)tag
{
#if RCT_PROFILE
  if (RCTProfileIsProfiling()) {
    NSString *label = RCTPLLabelForTag(tag);
    RCTProfileEndAsyncEvent(RCTProfileTagAlways, @"native", _cookies[tag], label, @"RCTPerformanceLogger");
  }
#endif
  if (_data[tag][0] != 0 && _data[tag][1] == 0) {
    _data[tag][1] = CACurrentMediaTime() * 1000;
  } else {
    RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

- (void)setValue:(int64_t)value forTag:(RCTPLTag)tag
{
  _data[tag][0] = 0;
  _data[tag][1] = value;
}

- (void)addValue:(int64_t)value forTag:(RCTPLTag)tag
{
  _data[tag][0] = 0;
  _data[tag][1] += value;
}

- (void)appendStartForTag:(RCTPLTag)tag
{
  _data[tag][0] = CACurrentMediaTime() * 1000;
}

- (void)appendStopForTag:(RCTPLTag)tag
{
  if (_data[tag][0] != 0) {
    _data[tag][1] += CACurrentMediaTime() * 1000 - _data[tag][0];
    _data[tag][0] = 0;
  } else {
    RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

- (NSArray<NSNumber *> *)valuesForTags
{
  NSMutableArray *result = [NSMutableArray array];
  for (NSUInteger index = 0; index < RCTPLSize; index++) {
    [result addObject:@(_data[index][0])];
    [result addObject:@(_data[index][1])];
  }
  return result;
}

- (int64_t)durationForTag:(RCTPLTag)tag
{
  return _data[tag][1] - _data[tag][0];
}

- (int64_t)valueForTag:(RCTPLTag)tag
{
  return _data[tag][1];
}

@end
