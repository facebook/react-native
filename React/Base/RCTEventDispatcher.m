/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTEventDispatcher.h"

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTBridge+Private.h"
#import "RCTUtils.h"
#import "RCTProfile.h"

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
    (((uint64_t)event.eventName.hash & 0xFFFF) << 32) |
    (((uint64_t)event.coalescingKey) << 48)
  );
}

@implementation RCTEventDispatcher
{
  // We need this lock to protect access to _events, _eventQueue and _eventsDispatchScheduled. It's filled in on main thread and consumed on js thread.
  NSLock *_eventQueueLock;
  // We have this id -> event mapping so we coalesce effectively.
  NSMutableDictionary<NSNumber *, id<RCTEvent>> *_events;
  // This array contains ids of events in order they come in, so we can emit them to JS in the exact same order.
  NSMutableArray<NSNumber *> *_eventQueue;
  BOOL _eventsDispatchScheduled;
  NSHashTable<id<RCTEventDispatcherObserver>> *_observers;
  NSLock *_observersLock;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
  _events = [NSMutableDictionary new];
  _eventQueue = [NSMutableArray new];
  _eventQueueLock = [NSLock new];
  _eventsDispatchScheduled = NO;
  _observers = [NSHashTable weakObjectsHashTable];
  _observersLock = [NSLock new];
}

- (void)sendAppEventWithName:(NSString *)name body:(id)body
{
  [_bridge enqueueJSCall:@"RCTNativeAppEventEmitter"
                  method:@"emit"
                    args:body ? @[name, body] : @[name]
              completion:NULL];
}

- (void)sendDeviceEventWithName:(NSString *)name body:(id)body
{
  [_bridge enqueueJSCall:@"RCTDeviceEventEmitter"
                  method:@"emit"
                    args:body ? @[name, body] : @[name]
              completion:NULL];
}

- (void)sendInputEventWithName:(NSString *)name body:(NSDictionary *)body
{
  if (RCT_DEBUG) {
    RCTAssert([body[@"target"] isKindOfClass:[NSNumber class]],
      @"Event body dictionary must include a 'target' property containing a React tag");
  }

  name = RCTNormalizeInputEventName(name);
  [_bridge enqueueJSCall:@"RCTEventEmitter"
                  method:@"receiveEvent"
                    args:body ? @[body[@"target"], name, body] : @[body[@"target"], name]
              completion:NULL];
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

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [self sendInputEventWithName:events[type] body:body];
#pragma clang diagnostic pop
}

- (void)sendEvent:(id<RCTEvent>)event
{
  [_observersLock lock];

  for (id<RCTEventDispatcherObserver> observer in _observers) {
    [observer eventDispatcherWillDispatchEvent:event];
  }

  [_observersLock unlock];

  [_eventQueueLock lock];

  NSNumber *eventID = RCTGetEventID(event);

  id<RCTEvent> previousEvent = _events[eventID];
  if (previousEvent) {
    RCTAssert([event canCoalesce], @"Got event %@ which cannot be coalesced, but has the same eventID %@ as the previous event %@", event, eventID, previousEvent);
    event = [previousEvent coalesceWithEvent:event];
  } else {
    [_eventQueue addObject:eventID];
  }
  _events[eventID] = event;

  BOOL scheduleEventsDispatch = NO;
  if (!_eventsDispatchScheduled) {
    _eventsDispatchScheduled = YES;
    scheduleEventsDispatch = YES;
  }

  // We have to release the lock before dispatching block with events,
  // since dispatchBlock: can be executed synchronously on the same queue.
  // (This is happening when chrome debugging is turned on.)
  [_eventQueueLock unlock];

  if (scheduleEventsDispatch) {
    [_bridge dispatchBlock:^{
      [self flushEventsQueue];
    } queue:RCTJSThread];
  }
}

- (void)addDispatchObserver:(id<RCTEventDispatcherObserver>)observer
{
  [_observersLock lock];
  [_observers addObject:observer];
  [_observersLock unlock];
}

- (void)removeDispatchObserver:(id<RCTEventDispatcherObserver>)observer
{
  [_observersLock lock];
  [_observers removeObject:observer];
  [_observersLock unlock];
}

- (void)dispatchEvent:(id<RCTEvent>)event
{
  [_bridge enqueueJSCall:[[event class] moduleDotMethod] args:[event arguments]];
}

- (dispatch_queue_t)methodQueue
{
  return RCTJSThread;
}

// js thread only (which surprisingly can be the main thread, depends on used JS executor)
- (void)flushEventsQueue
{
  [_eventQueueLock lock];
  NSDictionary *events = _events;
  _events = [NSMutableDictionary new];
  NSMutableArray *eventQueue = _eventQueue;
  _eventQueue = [NSMutableArray new];
  _eventsDispatchScheduled = NO;
  [_eventQueueLock unlock];

  for (NSNumber *eventId in eventQueue) {
    [self dispatchEvent:events[eventId]];
  }
}

@end

@implementation RCTBridge (RCTEventDispatcher)

- (RCTEventDispatcher *)eventDispatcher
{
  return [self moduleForClass:[RCTEventDispatcher class]];
}

@end
