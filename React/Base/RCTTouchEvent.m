/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTouchEvent.h"
#import "RCTAssert.h"

@implementation RCTTouchEvent
{
  NSArray<NSDictionary *> *_reactTouches;
  NSArray<NSNumber *> *_changedIndexes;
  uint16_t _coalescingKey;
}

@synthesize eventName = _eventName;
@synthesize viewTag = _viewTag;

- (instancetype)initWithEventName:(NSString *)eventName
                         reactTag:(NSNumber *)reactTag
                     reactTouches:(NSArray<NSDictionary *> *)reactTouches
                   changedIndexes:(NSArray<NSNumber *> *)changedIndexes
                    coalescingKey:(uint16_t)coalescingKey
{
  if (self = [super init]) {
    _viewTag = reactTag;
    _eventName = eventName;
    _reactTouches = reactTouches;
    _changedIndexes = changedIndexes;
    _coalescingKey = coalescingKey;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

#pragma mark - RCTEvent

- (BOOL)canCoalesce
{
  return [_eventName isEqual:@"touchMove"];
}

// We coalesce only move events, while holding some assumptions that seem reasonable but there are no explicit guarantees about them.
- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent
{
  RCTAssert([newEvent isKindOfClass:[RCTTouchEvent class]], @"Touch event cannot be coalesced with any other type of event, such as provided %@", newEvent);
  RCTTouchEvent *newTouchEvent = (RCTTouchEvent *)newEvent;
  RCTAssert([_reactTouches count] == [newTouchEvent->_reactTouches count], @"Touch events have different number of touches. %@ %@", self, newEvent);

  BOOL newEventIsMoreRecent = NO;
  BOOL oldEventIsMoreRecent = NO;
  NSInteger count = _reactTouches.count;
  for (int i = 0; i<count; i++) {
    NSDictionary *touch = _reactTouches[i];
    NSDictionary *newTouch = newTouchEvent->_reactTouches[i];
    RCTAssert([touch[@"identifier"] isEqual:newTouch[@"identifier"]], @"Touch events doesn't have touches in the same order. %@ %@", touch, newTouch);
    if ([touch[@"timestamp"] doubleValue] > [newTouch[@"timestamp"] doubleValue]) {
      oldEventIsMoreRecent = YES;
    } else {
      newEventIsMoreRecent = YES;
    }
  }
  RCTAssert(!(oldEventIsMoreRecent && newEventIsMoreRecent), @"Neither touch event is exclusively more recent than the other one. %@ %@", _reactTouches, newTouchEvent->_reactTouches);
  return newEventIsMoreRecent ? newEvent : self;
}

+ (NSString *)moduleDotMethod
{
  return @"RCTEventEmitter.receiveTouches";
}

- (NSArray *)arguments
{
  return @[RCTNormalizeInputEventName(_eventName), _reactTouches, _changedIndexes];
}

- (uint16_t)coalescingKey
{
  return _coalescingKey;
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@: %p; name = %@; coalescing key = %hu>", [self class], self, _eventName, _coalescingKey];
}

@end
