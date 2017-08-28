/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAnimatedValueChangeEvent.h"

@implementation RCTAnimatedValueChangeEvent
{
  CGFloat _value;
}

@synthesize viewTag = _viewTag;
@synthesize eventName = _eventName;
@synthesize coalescingKey = _coalescingKey;

- (instancetype)initWithNodeTag:(NSNumber *)nodeTag
                          value:(CGFloat)value
{
  if ((self = [super init])) {
    _eventName = @"onAnimatedValueUpdate";
    _viewTag = nodeTag;
    _coalescingKey = 0;
    _value = value;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (BOOL)canCoalesce
{
  return YES;
}

- (RCTAnimatedValueChangeEvent *)coalesceWithEvent:(RCTAnimatedValueChangeEvent *)newEvent
{
  return newEvent;
}

+ (NSString *)moduleDotMethod
{
  return @"RCTDeviceEventEmitter.emit";
}

- (NSArray *)arguments
{
  return @[_eventName, @{@"tag": _viewTag, @"value": @(_value)}];
}

@end
