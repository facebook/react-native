/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTTiming.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/featureflags/ReactNativeFeatureFlagsDefaults.h>

#import <memory>

using facebook::react::ReactNativeFeatureFlags;
using facebook::react::ReactNativeFeatureFlagsDefaults;

namespace {

class SleepUntilNextTimerFeatureFlags : public ReactNativeFeatureFlagsDefaults {
 public:
  bool sleepUntilNextTimerIOS() override
  {
    return true;
  }
};

} // namespace

@interface RCTTimingTestsDelegate : NSObject <RCTTimingDelegate>

@property (nonatomic, readonly) NSMutableArray<NSNumber *> *calledTimers;

@end

@implementation RCTTimingTestsDelegate

- (instancetype)init
{
  if (self = [super init]) {
    _calledTimers = [NSMutableArray new];
  }
  return self;
}

- (void)callTimers:(NSArray<NSNumber *> *)timers
{
  [_calledTimers addObjectsFromArray:timers];
}

- (void)immediatelyCallTimer:(NSNumber *)callbackID
{
  [_calledTimers addObject:callbackID];
}

- (void)callIdleCallbacks:(NSNumber *)absoluteFrameStartMS
{
}

@end

@interface RCTTimingTests : XCTestCase
@end

@implementation RCTTimingTests {
  RCTTimingTestsDelegate *_delegate;
  RCTTiming *_timing;
}

- (void)setUpWithSleepUntilNextTimer:(BOOL)sleepUntilNextTimer
{
  ReactNativeFeatureFlags::dangerouslyReset();
  if (sleepUntilNextTimer) {
    ReactNativeFeatureFlags::override(std::make_unique<SleepUntilNextTimerFeatureFlags>());
  }
  _delegate = [RCTTimingTestsDelegate new];
  _timing = [[RCTTiming alloc] initWithDelegate:_delegate];
}

- (void)tearDown
{
  [_timing invalidate];
  _timing = nil;
  _delegate = nil;
  ReactNativeFeatureFlags::dangerouslyReset();
  [super tearDown];
}

- (void)createTimer:(NSInteger)callbackID duration:(NSTimeInterval)duration
{
  [_timing createTimerForNextFrame:@(callbackID) duration:duration jsSchedulingTime:nil repeats:NO];
}

// Runs the run loop until `condition` holds or `timeout` passes. The run loop
// may have no sources, in which case `runMode:beforeDate:` returns at once, so
// keep going until the deadline.
- (BOOL)runRunLoopUntil:(BOOL (^)(void))condition timeout:(NSTimeInterval)timeout
{
  NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:timeout];
  while (!condition()) {
    if ([deadline timeIntervalSinceNow] <= 0) {
      return NO;
    }
    NSDate *step = [NSDate dateWithTimeIntervalSinceNow:0.005];
    if (![[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:step]) {
      [NSThread sleepForTimeInterval:0.005];
    }
  }
  return YES;
}

- (void)runRunLoopFor:(NSTimeInterval)duration
{
  [self
      runRunLoopUntil:^BOOL {
        return NO;
      }
              timeout:duration];
}

- (void)testTimerDueWithinTwoFramesRunsDisplayLink
{
  [self setUpWithSleepUntilNextTimer:YES];

  [self createTimer:1 duration:0.01];

  XCTAssertFalse(_timing.paused);
}

- (void)testTimerFurtherThanTwoFramesSleepsWithFlag
{
  [self setUpWithSleepUntilNextTimer:YES];

  [self createTimer:1 duration:0.3];

  XCTAssertTrue(_timing.paused);
}

- (void)testTimerWithinOneSecondRunsDisplayLinkWithoutFlag
{
  [self setUpWithSleepUntilNextTimer:NO];

  [self createTimer:1 duration:0.3];

  XCTAssertFalse(_timing.paused);
}

- (void)testSleepingTimerIsCalledWhenDueAndNotBefore
{
  [self setUpWithSleepUntilNextTimer:YES];

  NSDate *start = [NSDate date];
  [self createTimer:1 duration:0.5];

  [self runRunLoopFor:0.1];
  XCTAssertEqualObjects(_delegate.calledTimers, @[]);

  RCTTimingTestsDelegate *delegate = _delegate;
  XCTAssertTrue([self
      runRunLoopUntil:^BOOL {
        return delegate.calledTimers.count > 0;
      }
              timeout:2]);
  XCTAssertEqualObjects(_delegate.calledTimers, @[ @1 ]);
  XCTAssertGreaterThanOrEqual(-[start timeIntervalSinceNow], 0.5);
}

- (void)testNearerTimerMovesSleepTimerEarlier
{
  [self setUpWithSleepUntilNextTimer:YES];

  [self createTimer:1 duration:1];
  [self createTimer:2 duration:0.2];
  XCTAssertTrue(_timing.paused);

  RCTTimingTestsDelegate *delegate = _delegate;
  XCTAssertTrue([self
      runRunLoopUntil:^BOOL {
        return delegate.calledTimers.count > 0;
      }
              timeout:0.8]);
  XCTAssertEqualObjects(_delegate.calledTimers, @[ @2 ]);
}

- (void)testDeletedSleepingTimerIsNotCalled
{
  [self setUpWithSleepUntilNextTimer:YES];

  [self createTimer:1 duration:0.1];
  [_timing deleteTimer:1];

  [self runRunLoopFor:0.3];
  XCTAssertEqualObjects(_delegate.calledTimers, @[]);
  XCTAssertTrue(_timing.paused);
}

- (void)testDisplayLinkPausesWhenNextTimerIsFurtherThanTwoFrames
{
  [self setUpWithSleepUntilNextTimer:YES];

  [self createTimer:1 duration:0.01];
  [self createTimer:2 duration:0.5];
  XCTAssertFalse(_timing.paused);

  // The first timer is due: the frame calls it and keeps the display link
  // running for one more frame.
  [self runRunLoopFor:0.02];
  [_timing didUpdateFrame:nil];
  XCTAssertEqualObjects(_delegate.calledTimers, @[ @1 ]);
  XCTAssertFalse(_timing.paused);

  // Only the second timer is left, about 0.5 s away: the display link pauses
  // and a sleep timer calls it.
  [_timing didUpdateFrame:nil];
  XCTAssertTrue(_timing.paused);

  RCTTimingTestsDelegate *delegate = _delegate;
  XCTAssertTrue([self
      runRunLoopUntil:^BOOL {
        return delegate.calledTimers.count > 1;
      }
              timeout:2]);
  XCTAssertEqualObjects(_delegate.calledTimers, (@[ @1, @2 ]));
}

- (void)testDisplayLinkKeepsRunningForTimersWithinOneSecondWithoutFlag
{
  [self setUpWithSleepUntilNextTimer:NO];

  [self createTimer:1 duration:0.01];
  [self createTimer:2 duration:0.5];

  [self runRunLoopFor:0.02];
  [_timing didUpdateFrame:nil];
  [_timing didUpdateFrame:nil];

  XCTAssertEqualObjects(_delegate.calledTimers, @[ @1 ]);
  XCTAssertFalse(_timing.paused);
}

@end
