/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <OCMock/OCMock.h>

#import <React/RCTEventDispatcher.h>

@interface RCTTestEvent : NSObject <RCTEvent>
@property (atomic, assign, readwrite) BOOL canCoalesce;
@end

@implementation RCTTestEvent
{
  NSDictionary<NSString *, id> *_body;
}

@synthesize viewTag = _viewTag;
@synthesize eventName = _eventName;
@synthesize coalescingKey = _coalescingKey;

- (instancetype)initWithViewTag:(NSNumber *)viewTag
                      eventName:(NSString *)eventName
                           body:(NSDictionary<NSString *, id> *)body
                  coalescingKey:(uint16_t)coalescingKey
{
  if (self = [super init]) {
    _viewTag = viewTag;
    _eventName = eventName;
    _body = body;
    _canCoalesce = YES;
    _coalescingKey = coalescingKey;
  }
  return self;
}

- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent
{
  return newEvent;
}

+ (NSString *)moduleDotMethod
{
  return @"MyCustomEventemitter.emit";
}

- (NSArray *)arguments
{
  return @[_eventName, _body];
}

@end

@interface RCTDummyBridge : RCTBridge
- (void)dispatchBlock:(dispatch_block_t)block
                queue:(dispatch_queue_t)queue;
@end

@implementation RCTDummyBridge
- (void)dispatchBlock:(dispatch_block_t)block
                queue:(dispatch_queue_t)queue
{}
@end

@interface RCTEventDispatcherTests : XCTestCase
@end

@implementation RCTEventDispatcherTests
{
  id _bridge;
  RCTEventDispatcher *_eventDispatcher;

  NSString *_eventName;
  NSDictionary<NSString *, id> *_body;
  RCTTestEvent *_testEvent;
  NSString *_JSMethod;
}


- (void)setUp
{
  [super setUp];

  _bridge = [OCMockObject mockForClass:[RCTDummyBridge class]];

  _eventDispatcher = [RCTEventDispatcher new];
  [_eventDispatcher setValue:_bridge forKey:@"bridge"];

  _eventName = RCTNormalizeInputEventName(@"sampleEvent");
  _body = @{ @"foo": @"bar" };
  _testEvent = [[RCTTestEvent alloc] initWithViewTag:nil
                                           eventName:_eventName
                                                body:_body
                                       coalescingKey:0];

  _JSMethod = [[_testEvent class] moduleDotMethod];
}

- (void)testLegacyEventsAreImmediatelyDispatched
{
  [[_bridge expect] enqueueJSCall:@"RCTDeviceEventEmitter"
                           method:@"emit"
                             args:[_testEvent arguments]
                       completion:NULL];

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [_eventDispatcher sendDeviceEventWithName:_eventName body:_body];
#pragma clang diagnostic pop

  [_bridge verify];
}

- (void)testNonCoalescingEventIsImmediatelyDispatched
{
  _testEvent.canCoalesce = NO;

  [[_bridge expect] dispatchBlock:OCMOCK_ANY queue:RCTJSThread];

  [_eventDispatcher sendEvent:_testEvent];

  [_bridge verify];
}

- (void)testCoalescingEventIsImmediatelyDispatched
{
  _testEvent.canCoalesce = YES;

  [[_bridge expect] dispatchBlock:OCMOCK_ANY queue:RCTJSThread];

  [_eventDispatcher sendEvent:_testEvent];

  [_bridge verify];
}

- (void)testMultipleEventsResultInOnlyOneDispatchAfterTheFirstOne
{
  [[_bridge expect] dispatchBlock:OCMOCK_ANY queue:RCTJSThread];
  [_eventDispatcher sendEvent:_testEvent];
  [_eventDispatcher sendEvent:_testEvent];
  [_eventDispatcher sendEvent:_testEvent];
  [_eventDispatcher sendEvent:_testEvent];
  [_eventDispatcher sendEvent:_testEvent];
  [_bridge verify];
}

- (void)testRunningTheDispatchedBlockResultInANewOneBeingEnqueued
{
  __block dispatch_block_t eventsEmittingBlock;
  [[_bridge expect] dispatchBlock:[OCMArg checkWithBlock:^(dispatch_block_t block) {
    eventsEmittingBlock = block;
    return YES;
  }] queue:RCTJSThread];
  [_eventDispatcher sendEvent:_testEvent];
  [_bridge verify];

  // eventsEmittingBlock would be called when js is no longer busy, which will result in emitting events
  [[_bridge expect] enqueueJSCall:[[_testEvent class] moduleDotMethod]
                             args:[_testEvent arguments]];
  eventsEmittingBlock();
  [_bridge verify];


  [[_bridge expect] dispatchBlock:OCMOCK_ANY queue:RCTJSThread];
  [_eventDispatcher sendEvent:_testEvent];
  [_bridge verify];
}

- (void)testBasicCoalescingReturnsLastEvent
{
  __block dispatch_block_t eventsEmittingBlock;
  [[_bridge expect] dispatchBlock:[OCMArg checkWithBlock:^(dispatch_block_t block) {
    eventsEmittingBlock = block;
    return YES;
  }] queue:RCTJSThread];
  [[_bridge expect] enqueueJSCall:[[_testEvent class] moduleDotMethod]
                             args:[_testEvent arguments]];

  RCTTestEvent *ignoredEvent = [[RCTTestEvent alloc] initWithViewTag:nil
                                                           eventName:_eventName
                                                                body:@{ @"other": @"body" }
                                                       coalescingKey:0];
  [_eventDispatcher sendEvent:ignoredEvent];
  [_eventDispatcher sendEvent:_testEvent];
  eventsEmittingBlock();

  [_bridge verify];
}

- (void)testDifferentEventTypesDontCoalesce
{
  NSString *firstEventName = RCTNormalizeInputEventName(@"firstEvent");
  RCTTestEvent *firstEvent = [[RCTTestEvent alloc] initWithViewTag:nil
                                                         eventName:firstEventName
                                                              body:_body
                                                     coalescingKey:0];

  __block dispatch_block_t eventsEmittingBlock;
  [[_bridge expect] dispatchBlock:[OCMArg checkWithBlock:^(dispatch_block_t block) {
    eventsEmittingBlock = block;
    return YES;
  }] queue:RCTJSThread];
  [[_bridge expect] enqueueJSCall:[[_testEvent class] moduleDotMethod]
                             args:[firstEvent arguments]];
  [[_bridge expect] enqueueJSCall:[[_testEvent class] moduleDotMethod]
                             args:[_testEvent arguments]];


  [_eventDispatcher sendEvent:firstEvent];
  [_eventDispatcher sendEvent:_testEvent];
  eventsEmittingBlock();

  [_bridge verify];
}

- (void)testSameEventTypesWithDifferentCoalesceKeysDontCoalesce
{
  NSString *eventName = RCTNormalizeInputEventName(@"firstEvent");
  RCTTestEvent *firstEvent = [[RCTTestEvent alloc] initWithViewTag:nil
                                                         eventName:eventName
                                                              body:_body
                                                     coalescingKey:0];
  RCTTestEvent *secondEvent = [[RCTTestEvent alloc] initWithViewTag:nil
                                                         eventName:eventName
                                                              body:_body
                                                     coalescingKey:1];

  __block dispatch_block_t eventsEmittingBlock;
  [[_bridge expect] dispatchBlock:[OCMArg checkWithBlock:^(dispatch_block_t block) {
    eventsEmittingBlock = block;
    return YES;
  }] queue:RCTJSThread];
  [[_bridge expect] enqueueJSCall:[[_testEvent class] moduleDotMethod]
                             args:[firstEvent arguments]];
  [[_bridge expect] enqueueJSCall:[[_testEvent class] moduleDotMethod]
                             args:[secondEvent arguments]];


  [_eventDispatcher sendEvent:firstEvent];
  [_eventDispatcher sendEvent:secondEvent];
  [_eventDispatcher sendEvent:firstEvent];
  [_eventDispatcher sendEvent:secondEvent];
  [_eventDispatcher sendEvent:secondEvent];
  [_eventDispatcher sendEvent:firstEvent];
  [_eventDispatcher sendEvent:firstEvent];

  eventsEmittingBlock();

  [_bridge verify];
}

@end
