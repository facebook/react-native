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

static NSNumber *RCTGetEventID(id<RCTEvent> event)
{
  return @(
    [event.viewTag intValue] |
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
  RCTAssertParam(eventName);

  if ((self = [super init])) {
    _viewTag = viewTag;
    _eventName = eventName;
    _body = body;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-init)

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

@interface RCTEventDispatcher() <RCTBridgeModule, RCTFrameUpdateObserver>

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
    _eventQueue = [[NSMutableDictionary alloc] init];
    _eventQueueLock = [[NSLock alloc] init];
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
  RCTAssert([body[@"target"] isKindOfClass:[NSNumber class]],
    @"Event body dictionary must include a 'target' property containing a React tag");

  [_bridge enqueueJSCall:@"RCTEventEmitter.receiveEvent"
                    args:body ? @[body[@"target"], name, body] : @[body[@"target"], name]];
}

- (void)sendTextEventWithType:(RCTTextEventType)type
                     reactTag:(NSNumber *)reactTag
                         text:(NSString *)text
{
  static NSString *events[] = {
    @"topFocus",
    @"topBlur",
    @"topChange",
    @"topSubmitEditing",
    @"topEndEditing",
  };

  [self sendInputEventWithName:events[type] body:text ? @{
    @"text": text,
    @"target": reactTag
  } : @{
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
  NSMutableArray *arguments = [[NSMutableArray alloc] init];

  if (event.viewTag) {
    [arguments addObject:event.viewTag];
  }

  [arguments addObject:event.eventName];

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
  _eventQueue = [[NSMutableDictionary alloc] init];
  _paused = YES;
  [_eventQueueLock unlock];

  for (id<RCTEvent> event in eventQueue.allValues) {
    [self dispatchEvent:event];
  }
}

@end
