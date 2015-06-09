// Copyright 2004-present Facebook. All Rights Reserved.

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <OCMock/OCMock.h>
#import "RCTEventDispatcher.h"

@interface RCTTestEvent : RCTBaseEvent

@property (nonatomic, assign) BOOL canCoalesce;

@end

@implementation RCTTestEvent

- (instancetype)initWithViewTag:(NSNumber *)viewTag eventName:(NSString *)eventName body:(NSDictionary *)body
{
  if (self = [super initWithViewTag:viewTag eventName:eventName body:body]) {
    self.canCoalesce = YES;
  }
  return self;
}

+ (NSString *)moduleDotMethod
{
  return @"RCTDeviceEventEmitter.emit";
}

@end

@interface RCTEventDispatcherTests : XCTestCase
@end

@implementation RCTEventDispatcherTests
{
  id _bridge;
  RCTEventDispatcher *_eventDispatcher;

  NSString *_eventName;
  NSDictionary *_body;
  RCTTestEvent *_testEvent;
  NSString *_JSMethod;
}


- (void)setUp
{
  [super setUp];

  _bridge = [OCMockObject mockForClass:[RCTBridge class]];
  _eventDispatcher = [[RCTEventDispatcher alloc] init];
  ((id<RCTBridgeModule>)_eventDispatcher).bridge = _bridge;

  _eventName = @"sampleEvent";
  _body = @{ @"foo": @"bar" };
  _testEvent = [[RCTTestEvent alloc] initWithViewTag:nil
                                           eventName:_eventName
                                                body:_body];

  _JSMethod = [[_testEvent class] moduleDotMethod];
}

- (void)testLegacyEventsAreImmediatelyDispatched
{
  [[_bridge expect] enqueueJSCall:_JSMethod
                             args:@[_eventName, _body]];

  [_eventDispatcher sendDeviceEventWithName:_eventName body:_body];

  [_bridge verify];
}

- (void)testNonCoalescingEventsAreImmediatelyDispatched
{
  _testEvent.canCoalesce = NO;
  [[_bridge expect] enqueueJSCall:_JSMethod
                             args:@[_eventName, _body]];

  [_eventDispatcher sendEvent:_testEvent];

  [_bridge verify];
}

- (void)testCoalescedEventShouldBeDispatchedOnFrameUpdate
{
  [_eventDispatcher sendEvent:_testEvent];

  [[_bridge expect] enqueueJSCall:@"RCTDeviceEventEmitter.emit"
                             args:@[_eventName, _body]];

  [(id<RCTFrameUpdateObserver>)_eventDispatcher didUpdateFrame:nil];

  [_bridge verify];
}

- (void)testBasicCoalescingReturnsLastEvent
{
  RCTTestEvent *ignoredEvent = [[RCTTestEvent alloc] initWithViewTag:nil
                                                           eventName:_eventName
                                                                body:@{ @"other": @"body" }];

  [_eventDispatcher sendEvent:ignoredEvent];
  [_eventDispatcher sendEvent:_testEvent];

  [[_bridge expect] enqueueJSCall:@"RCTDeviceEventEmitter.emit"
                             args:@[_eventName, _body]];

  [(id<RCTFrameUpdateObserver>)_eventDispatcher didUpdateFrame:nil];

  [_bridge verify];
}

- (void)testDifferentEventTypesDontCoalesce
{
  NSString *firstEventName = @"firstEvent";
  RCTTestEvent *firstEvent = [[RCTTestEvent alloc] initWithViewTag:nil
                                                           eventName:firstEventName
                                                                body:_body];

  [_eventDispatcher sendEvent:firstEvent];
  [_eventDispatcher sendEvent:_testEvent];

  [[_bridge expect] enqueueJSCall:@"RCTDeviceEventEmitter.emit"
                             args:@[firstEventName, _body]];

  [[_bridge expect] enqueueJSCall:@"RCTDeviceEventEmitter.emit"
                             args:@[_eventName, _body]];

  [(id<RCTFrameUpdateObserver>)_eventDispatcher didUpdateFrame:nil];

  [_bridge verify];
}

@end
