/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import <XCTest/XCTest.h>
#import <React/RCTAtomicCounter.h>

@interface RCTAtomicCounterTests : XCTestCase

@end

@implementation RCTAtomicCounterTests

-(void)testIncrement {
  NSUIntegerCounter nsUIntegerCounter = RCTCreateAtomicNSUIntegerCounter();
  XCTAssertEqual(nsUIntegerCounter(), 0);
  XCTAssertEqual(nsUIntegerCounter(), 1);
  UInt64Counter uint64Counter = RCTCreateAtomicUInt64Counter();
  XCTAssertEqual(uint64Counter(), 0);
  XCTAssertEqual(uint64Counter(), 1);
}

- (void)testConcurrent {
  XCTestExpectation *expectation1 = [self expectationWithDescription:@"wait for NSUInteger shared counter"];
  NSUIntegerCounter nsUIntegerCounter = RCTCreateAtomicNSUIntegerCounter();
  XCTestExpectation *expectation2 = [self expectationWithDescription:@"wait for uint64_t shared counter"];
  UInt64Counter uint64Counter = RCTCreateAtomicUInt64Counter();
  size_t iterations = 1000;
  dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
  dispatch_apply(iterations, queue, ^(__unused size_t iteration) {
    NSUInteger currentCount = nsUIntegerCounter();
    if (currentCount == 999) {
      [expectation1 fulfill];
    }
  });
  dispatch_apply(iterations, queue, ^(__unused size_t iteration) {
    uint64_t currentCount = uint64Counter();
    if (currentCount == 999) {
      [expectation2 fulfill];
    }
  });
  [self waitForExpectations:@[expectation1, expectation2] timeout:1.0];
}

-(void)testMemorySpy {
  __block void *nsUIntegercounterLifeCycleInfo;
  __block void *uint64CounterLifeCycleInfo;

  // Carry out operations in autoreleasepool to ensure counter blocks are deallocated
  // immediately when assigning `nil` to the variables that hold them. This is necessary
  // for carrying out RCTAssertAtomicNSUIntegerCounterIsDeallocated and
  // RCTAssertAtomicUInt64CounterIsDeallocated below.
  @autoreleasepool {
    NSUIntegerCounter nsUIntegerCount = RCTCreateAtomicNSUIntegerCounterWithSpy(^(void *lifeCycleInfo) {
      nsUIntegercounterLifeCycleInfo = lifeCycleInfo;
    });
    XCTAssertEqual(nsUIntegerCount(), 0);
    XCTAssertEqual(nsUIntegerCount(), 1);
    XCTAssertFalse(RCTAssertAtomicNSUIntegerCounterIsDeallocated(nsUIntegercounterLifeCycleInfo));
    nsUIntegerCount = nil;

    UInt64Counter uint64Count = RCTCreateAtomicUInt64CounterWithSpy(^(void *lifeCycleInfo) {
      uint64CounterLifeCycleInfo = lifeCycleInfo;
    });
    XCTAssertEqual(uint64Count(), 0);
    XCTAssertEqual(uint64Count(), 1);
    XCTAssertFalse(RCTAssertAtomicUInt64CounterIsDeallocated(uint64CounterLifeCycleInfo));
    uint64Count = nil;
  }
  XCTAssertTrue(RCTAssertAtomicNSUIntegerCounterIsDeallocated(nsUIntegercounterLifeCycleInfo));
  XCTAssertTrue(RCTAssertAtomicUInt64CounterIsDeallocated(uint64CounterLifeCycleInfo));
  free(nsUIntegercounterLifeCycleInfo);
  free(uint64CounterLifeCycleInfo);
}

@end
