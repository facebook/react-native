/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTEventDispatcher.h"

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTUtils.h"

const NSInteger RCTTextUpdateLagWarningThreshold = 3;

NSString *RCTNormalizeInputEventName(NSString *eventName)
{
  if ([eventName hasPrefix:@"on"]) {
    eventName = [eventName stringByReplacingCharactersInRange:(NSRange){0, 2} withString:@"top"];
  } else if (![eventName hasPrefix:@"top"]) {
    eventName = [[@"top" stringByAppendingString:[eventName substringToIndex:1].uppercaseString]
                 stringByAppendingString:[eventName substringFromIndex:1]];
  }
  return eventName;
}

static NSNumber *RCTGetEventID(id<RCTEvent> event)
{
  return @(
    event.viewTag.intValue |
    (((uint64_t)event.eventName.hash & 0xFFFF) << 32)  |
    (((uint64_t)event.coalescingKey) << 48)
  );
}

@implementation RCTBaseEvent

@synthesize viewTag = _viewTag;
@synthesize eventName = _eventName;
@synthesize body = _body;

- (instancetype)initWithViewTag:(NSNumber *)viewTag
                      eventName:(NSString *)eventName
                           body:(NSDictionary *)body
{
  if (RCT_DEBUG) {
    RCTAssertParam(eventName);
  }

  if ((self = [super init])) {
    _viewTag = viewTag;
    _eventName = eventName;
    _body = body;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (uint16_t)coalescingKey
{
  return 0;
}

- (BOOL)canCoalesce
{
  return YES;
}

- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent
{
  return newEvent;
}

+ (NSString *)moduleDotMethod
{
  return nil;
}

@end

@interface RCTEventDispatcher() <RCTFrameUpdateObserver>

@end

@implementation RCTEventDispatcher
{
  NSMutableDictionary *_eventQueue;
  NSLock *_eventQueueLock;
}

@synthesize bridge = _bridge;
@synthesize paused = _paused;

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if ((self = [super init])) {
    _eventQueue = [NSMutableDictionary new];
    _eventQueueLock = [NSLock new];
  }
  return self;
}

- (void)sendAppEventWithName:(NSString *)name body:(id)body
{
  [_bridge enqueueJSCall:@"RCTNativeAppEventEmitter.emit"
                    args:body ? @[name, body] : @[name]];
}

- (void)sendDeviceEventWithName:(NSString *)name body:(id)body
{
  [_bridge enqueueJSCall:@"RCTDeviceEventEmitter.emit"
                    args:body ? @[name, body] : @[name]];
}

- (void)sendInputEventWithName:(NSString *)name body:(NSDictionary *)body
{
  if (RCT_DEBUG) {
    RCTAssert([body[@"target"] isKindOfClass:[NSNumber class]],
      @"Event body dictionary must include a 'target' property containing a React tag");
  }

  name = RCTNormalizeInputEventName(name);
  [_bridge enqueueJSCall:@"RCTEventEmitter.receiveEvent"
                    args:body ? @[body[@"target"], name, body] : @[body[@"target"], name]];
}

- (void)sendTextEventWithType:(RCTTextEventType)type
                     reactTag:(NSNumber *)reactTag
                         text:(NSString *)text
                   eventCount:(NSInteger)eventCount
{
  static NSString *events[] = {
    @"focus",
    @"blur",
    @"change",
    @"submitEditing",
    @"endEditing",
  };

  [self sendInputEventWithName:events[type] body:text ? @{
    @"text": text,
    @"eventCount": @(eventCount),
    @"target": reactTag
  } : @{
    @"eventCount": @(eventCount),
    @"target": reactTag
  }];
}

- (void)sendEvent:(id<RCTEvent>)event
{
  if (!event.canCoalesce) {
    [self dispatchEvent:event];
    return;
  }

  [_eventQueueLock lock];

  NSNumber *eventID = RCTGetEventID(event);
  id<RCTEvent> previousEvent = _eventQueue[eventID];

  if (previousEvent) {
    event = [previousEvent coalesceWithEvent:event];
  }

  _eventQueue[eventID] = event;
  _paused = NO;

  [_eventQueueLock unlock];
}

- (void)dispatchEvent:(id<RCTEvent>)event
{
  NSMutableArray *arguments = [NSMutableArray new];

  if (event.viewTag) {
    [arguments addObject:event.viewTag];
  }

  [arguments addObject:RCTNormalizeInputEventName(event.eventName)];

  if (event.body) {
    [arguments addObject:event.body];
  }

  [_bridge enqueueJSCall:[[event class] moduleDotMethod]
                    args:arguments];
}

- (dispatch_queue_t)methodQueue
{
  return RCTJSThread;
}

- (void)didUpdateFrame:(__unused RCTFrameUpdate *)update
{
  [_eventQueueLock lock];
   NSDictionary *eventQueue = _eventQueue;
  _eventQueue = [NSMutableDictionary new];
  _paused = YES;
  [_eventQueueLock unlock];

  for (id<RCTEvent> event in eventQueue.allValues) {
    [self dispatchEvent:event];
  }
}

@end
