/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTEventEmitter.h"
#import <React/RCTConstants.h>
#import "RCTAssert.h"
#import "RCTLog.h"
#import "RCTUtils.h"

@implementation RCTEventEmitter {
  NSInteger _listenerCount;
  BOOL _observationDisabled;
}

@synthesize callableJSModules = _callableJSModules;

+ (NSString *)moduleName
{
  return @"";
}

+ (void)initialize
{
  [super initialize];
  if (self != [RCTEventEmitter class]) {
    RCTAssert(
        RCTClassOverridesInstanceMethod(self, @selector(supportedEvents)),
        @"You must override the `supportedEvents` method of %@",
        self);
  }
}

- (instancetype)initWithDisabledObservation
{
  self = [super init];
  _observationDisabled = YES;
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return nil;
}

- (void)sendEventWithName:(NSString *)eventName body:(id)body
{
  // Assert that subclasses of RCTEventEmitter does not have `@synthesize _callableJSModules`
  // which would cause _callableJSModules in the parent RCTEventEmitter to be nil.
  RCTAssert(
      _callableJSModules != nil,
      @"Error when sending event: %@ with body: %@. "
       "RCTCallableJSModules is not set. This is probably because you've "
       "explicitly synthesized the RCTCallableJSModules in %@, even though it's inherited "
       "from RCTEventEmitter.",
      eventName,
      body,
      [self class]);

  if (RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    RCTLogError(
        @"`%@` is not a supported event type for %@. Supported events are: `%@`",
        eventName,
        [self class],
        [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }

  BOOL shouldEmitEvent = (_observationDisabled || _listenerCount > 0);

  if (shouldEmitEvent && _callableJSModules) {
    [_callableJSModules invokeModule:@"RCTDeviceEventEmitter"
                              method:@"emit"
                            withArgs:body ? @[ eventName, body ] : @[ eventName ]];
  } else {
    RCTLogWarn(@"Sending `%@` with no listeners registered.", eventName);
  }
}

/* TODO: (T118587955) Remove canSendEvents_DEPRECATED and validate RCTEventEmitter does not fail
 * RCTAssert in _callableJSModules when the React Native instance is invalidated.
 */
- (BOOL)canSendEvents_DEPRECATED
{
  bool canSendEvents = _callableJSModules != nil;
  if (!canSendEvents && RCTGetValidateCanSendEventInRCTEventEmitter()) {
    RCTLogError(@"Trying to send event when _callableJSModules is nil.");
  }
  return canSendEvents;
}

- (void)startObserving
{
  // Does nothing
}

- (void)stopObserving
{
  // Does nothing
}

- (void)invalidate
{
  if (_observationDisabled) {
    return;
  }

  if (_listenerCount > 0) {
    [self stopObserving];
  }
}

RCT_EXPORT_METHOD(addListener : (NSString *)eventName)
{
  if (_observationDisabled) {
    return;
  }

  if (RCT_DEBUG && ![[self supportedEvents] containsObject:eventName]) {
    RCTLogError(
        @"`%@` is not a supported event type for %@. Supported events are: `%@`",
        eventName,
        [self class],
        [[self supportedEvents] componentsJoinedByString:@"`, `"]);
  }
  _listenerCount++;
  if (_listenerCount == 1) {
    [self startObserving];
  }
}

RCT_EXPORT_METHOD(removeListeners : (double)count)
{
  if (_observationDisabled) {
    return;
  }

  int currentCount = (int)count;
  if (RCT_DEBUG && currentCount > _listenerCount) {
    RCTLogError(@"Attempted to remove more %@ listeners than added", [self class]);
  }
  _listenerCount = MAX(_listenerCount - currentCount, 0);
  if (_listenerCount == 0) {
    [self stopObserving];
  }
}

@end
