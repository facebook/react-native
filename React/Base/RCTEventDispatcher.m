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
    (((uint64_t)event.eventName.hash & 0xFFFF) << 32));
}

@interface RCTEventDispatcher() <RCTFrameUpdateObserver>

@end

@implementation RCTEventDispatcher
{
  NSMutableDictionary *_eventQueue;
  NSLock *_eventQueueLock;
}

@synthesize bridge = _bridge;
@synthesize paused = _paused;
@synthesize pauseCallback = _pauseCallback;

RCT_EXPORT_MODULE()

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
  _paused = YES;
  _eventQueue = [NSMutableDictionary new];
  _eventQueueLock = [NSLock new];
}

- (void)setPaused:(BOOL)paused
{
  if (_paused != paused) {
    _paused = paused;
    if (_pauseCallback) {
      _pauseCallback();
    }
  }
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
                          key:(NSString *)key
                   eventCount:(NSInteger)eventCount
{
  static NSString *events[] = {
    @"focus",
    @"blur",
    @"change",
    @"submitEditing",
    @"endEditing",
    @"keyPress"
  };

  NSMutableDictionary *body = [[NSMutableDictionary alloc] initWithDictionary:@{
    @"eventCount": @(eventCount),
    @"target": reactTag
  }];

  if (text) {
    body[@"text"] = text;
  }

  if (key) {
    if (key.length == 0) {
      key = @"Backspace"; // backspace
    } else {
      switch ([key characterAtIndex:0]) {
        case '\t':
          key = @"Tab";
          break;
        case '\n':
          key = @"Enter";
        default:
          break;
      }
    }
    body[@"key"] = key;
  }

  [self sendInputEventWithName:events[type] body:body];
}

- (void)sendEvent:(id<RCTEvent>)event
{
  if (!event.canCoalesce) {
    [self flushEventsQueue];
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
  self.paused = NO;

  [_eventQueueLock unlock];
}

- (void)dispatchEvent:(id<RCTEvent>)event
{
  [_bridge enqueueJSCall:[[event class] moduleDotMethod] args:[event arguments]];
}

- (dispatch_queue_t)methodQueue
{
  return RCTJSThread;
}

- (void)didUpdateFrame:(__unused RCTFrameUpdate *)update
{
  [self flushEventsQueue];
}

- (void)flushEventsQueue
{
  [_eventQueueLock lock];
  NSDictionary *eventQueue = _eventQueue;
  _eventQueue = [NSMutableDictionary new];
  self.paused = YES;
  [_eventQueueLock unlock];

  for (id<RCTEvent> event in eventQueue.allValues) {
    [self dispatchEvent:event];
  }
}

@end
