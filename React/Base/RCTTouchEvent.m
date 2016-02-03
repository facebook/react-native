/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTouchEvent.h"

@implementation RCTTouchEvent
{
  NSArray<NSDictionary *> *_reactTouches;
  NSArray<NSNumber *> *_changedIndexes;
}

@synthesize eventName = _eventName;
@synthesize viewTag = _viewTag;

- (instancetype)initWithEventName:(NSString *)eventName
                     reactTouches:(NSArray<NSDictionary *> *)reactTouches
                   changedIndexes:(NSArray<NSNumber *> *)changedIndexes
{
  if (self = [super init]) {
    _eventName = eventName;
    _reactTouches = reactTouches;
    _changedIndexes = changedIndexes;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

#pragma mark - RCTEvent

- (BOOL)canCoalesce
{
  return NO;
}

- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent
{
  return newEvent;
}

+ (NSString *)moduleDotMethod
{
  return @"RCTEventEmitter.receiveTouches";
}

- (NSArray *)arguments
{
  return @[RCTNormalizeInputEventName(_eventName), _reactTouches, _changedIndexes];
}

@end
