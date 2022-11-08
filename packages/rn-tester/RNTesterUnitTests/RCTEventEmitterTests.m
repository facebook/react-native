/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTEventEmitter.h>
#import <XCTest/XCTest.h>

#pragma mark - Faulty EventEmitter

@interface RCTFaultyEventEmitter : RCTEventEmitter
@end

@implementation RCTFaultyEventEmitter {
  NSString *_capturedMessage;
}

- (NSString *)capturedMessage
{
  return _capturedMessage;
}

- (void)_log:(NSString *)message
{
  _capturedMessage = message;
}
@end

#pragma mark - Proper EventEmitter

@interface RCTProperEventEmitter : RCTEventEmitter
@end

@implementation RCTProperEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"myEvent" ];
}
@end

#pragma mark - Tests Code

@interface RCTEventEmitterTests : XCTestCase

@end

@implementation RCTEventEmitterTests

- (void)testEventEmitterSubclass_whenFaultySubclassInvokesSupportedEvents_raiseException
{
  RCTEventEmitter *emitter = [[RCTFaultyEventEmitter alloc] init];

  NSArray<NSString *> *events = emitter.supportedEvents;
  XCTAssertNil(events);
  XCTAssertEqualObjects(
      ((RCTFaultyEventEmitter *)emitter).capturedMessage,
      @"RCTFaultyEventEmitter must implement the supportedEvents method");
}

- (void)testEventEmitterSubclass_whenProperSubclassInvokesSupportedEvents_itreturnsTheEvents
{
  RCTEventEmitter *emitter = [[RCTProperEventEmitter alloc] init];

  NSArray<NSString *> *events = emitter.supportedEvents;

  XCTAssertEqualObjects(events, @[ @"myEvent" ]);
}

@end
