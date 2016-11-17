/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTiming.h"

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTBridge+Private.h"
#import "RCTLog.h"
#import "RCTUtils.h"

static const NSTimeInterval kMinimumSleepInterval = 1;

// These timing contants should be kept in sync with the ones in `JSTimersExecution.js`.
// The duration of a frame. This assumes that we want to run at 60 fps.
static const NSTimeInterval kFrameDuration = 1.0 / 60.0;
// The minimum time left in a frame to trigger the idle callback.
static const NSTimeInterval kIdleCallbackFrameDeadline = 0.001;

@interface _RCTTimer : NSObject

@property (nonatomic, strong, readonly) NSDate *target;
@property (nonatomic, assign, readonly) BOOL repeats;
@property (nonatomic, copy, readonly) NSNumber *callbackID;
@property (nonatomic, assign, readonly) NSTimeInterval interval;

@end

@implementation _RCTTimer

- (instancetype)initWithCallbackID:(NSNumber *)callbackID
                          interval:(NSTimeInterval)interval
                        targetTime:(NSTimeInterval)targetTime
                           repeats:(BOOL)repeats
{
  if ((self = [super init])) {
    _interval = interval;
    _repeats = repeats;
    _callbackID = callbackID;
    _target = [NSDate dateWithTimeIntervalSinceNow:targetTime];
  }
  return self;
}

/**
 * Returns `YES` if we should invoke the JS callback.
 */
- (BOOL)updateFoundNeedsJSUpdate
{
  if (_target && _target.timeIntervalSinceNow <= 0) {
    // The JS Timers will do fine grained calculating of expired timeouts.
    _target = _repeats ? [NSDate dateWithTimeIntervalSinceNow:_interval] : nil;
    return YES;
  }
  return NO;
}

@end

@interface _RCTTimingProxy : NSObject

@end

// NSTimer retains its target, insert this class to break potential retain cycles
@implementation _RCTTimingProxy
{
  __weak id _target;
}

+ (instancetype)proxyWithTarget:(id)target
{
  _RCTTimingProxy *proxy = [self new];
  if (proxy) {
    proxy->_target = target;
  }
  return proxy;
}

- (void)timerDidFire
{
  [_target timerDidFire];
}

@end

@implementation RCTTiming
{
  NSMutableDictionary<NSNumber *, _RCTTimer *> *_timers;
  NSTimer *_sleepTimer;
  BOOL _sendIdleEvents;
}

@synthesize bridge = _bridge;
@synthesize paused = _paused;
@synthesize pauseCallback = _pauseCallback;

RCT_EXPORT_MODULE()

- (void)setBridge:(RCTBridge *)bridge
{
  RCTAssert(!_bridge, @"Should never be initialized twice!");

  _paused = YES;
  _timers = [NSMutableDictionary new];

  for (NSString *name in @[UIApplicationWillResignActiveNotification,
                           UIApplicationDidEnterBackgroundNotification,
                           UIApplicationWillTerminateNotification]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(stopTimers)
                                                 name:name
                                               object:nil];
  }

  for (NSString *name in @[UIApplicationDidBecomeActiveNotification,
                           UIApplicationWillEnterForegroundNotification]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(startTimers)
                                                 name:name
                                               object:nil];
  }

  _bridge = bridge;
}

- (void)dealloc
{
  [_sleepTimer invalidate];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (dispatch_queue_t)methodQueue
{
  return RCTJSThread;
}

- (void)invalidate
{
  [self stopTimers];
  _bridge = nil;
}

- (void)stopTimers
{
  if (!_paused) {
    _paused = YES;
    if (_pauseCallback) {
      _pauseCallback();
    }
  }
}

- (void)startTimers
{
  if (!_bridge || ![self hasPendingTimers]) {
    return;
  }

  if (_paused) {
    _paused = NO;
    if (_pauseCallback) {
      _pauseCallback();
    }
  }
}

- (BOOL)hasPendingTimers
{
  return _sendIdleEvents || _timers.count > 0;
}

- (void)didUpdateFrame:(RCTFrameUpdate *)update
{
  NSDate *nextScheduledTarget = [NSDate distantFuture];
  NSMutableArray<NSNumber *> *timersToCall = [NSMutableArray new];
  for (_RCTTimer *timer in _timers.allValues) {
    if ([timer updateFoundNeedsJSUpdate]) {
      [timersToCall addObject:timer.callbackID];
    }
    if (!timer.target) {
      [_timers removeObjectForKey:timer.callbackID];
    } else {
      nextScheduledTarget = [nextScheduledTarget earlierDate:timer.target];
    }
  }

  // Call timers that need to be called
  if (timersToCall.count > 0) {
    [_bridge enqueueJSCall:@"JSTimersExecution"
                    method:@"callTimers"
                      args:@[timersToCall]
                completion:NULL];
  }

  if (_sendIdleEvents) {
    NSTimeInterval frameElapsed = (CACurrentMediaTime() - update.timestamp);
    if (kFrameDuration - frameElapsed >= kIdleCallbackFrameDeadline) {
      NSTimeInterval currentTimestamp = [[NSDate date] timeIntervalSince1970];
      NSNumber *absoluteFrameStartMS = @((currentTimestamp - frameElapsed) * 1000);
      [_bridge enqueueJSCall:@"JSTimersExecution"
                      method:@"callIdleCallbacks"
                        args:@[absoluteFrameStartMS]
                  completion:NULL];
    }
  }

  // Switch to a paused state only if we didn't call any timer this frame, so if
  // in response to this timer another timer is scheduled, we don't pause and unpause
  // the displaylink frivolously.
  if (!_sendIdleEvents && timersToCall.count == 0) {
    // No need to call the pauseCallback as RCTDisplayLink will ask us about our paused
    // status immediately after completing this call
    if (_timers.count == 0) {
      _paused = YES;
    }
    // If the next timer is more than 1 second out, pause and schedule an NSTimer;
    else if ([nextScheduledTarget timeIntervalSinceNow] > kMinimumSleepInterval) {
      [self scheduleSleepTimer:nextScheduledTarget];
      _paused = YES;
    }
  }
}

- (void)scheduleSleepTimer:(NSDate *)sleepTarget
{
  if (!_sleepTimer || !_sleepTimer.valid) {
    _sleepTimer = [[NSTimer alloc] initWithFireDate:sleepTarget
                                           interval:0
                                             target:[_RCTTimingProxy proxyWithTarget:self]
                                           selector:@selector(timerDidFire)
                                           userInfo:nil
                                            repeats:NO];
    [[NSRunLoop currentRunLoop] addTimer:_sleepTimer forMode:NSDefaultRunLoopMode];
  } else {
    _sleepTimer.fireDate = [_sleepTimer.fireDate earlierDate:sleepTarget];
  }
}

- (void)timerDidFire
{
  _sleepTimer = nil;
  if (_paused) {
    [self startTimers];

    // Immediately dispatch frame, so we don't have to wait on the displaylink.
    [self didUpdateFrame:nil];
  }
}

/**
 * There's a small difference between the time when we call
 * setTimeout/setInterval/requestAnimation frame and the time it actually makes
 * it here. This is important and needs to be taken into account when
 * calculating the timer's target time. We calculate this by passing in
 * Date.now() from JS and then subtracting that from the current time here.
 */
RCT_EXPORT_METHOD(createTimer:(nonnull NSNumber *)callbackID
                  duration:(NSTimeInterval)jsDuration
                  jsSchedulingTime:(NSDate *)jsSchedulingTime
                  repeats:(BOOL)repeats)
{
  if (jsDuration == 0 && repeats == NO) {
    // For super fast, one-off timers, just enqueue them immediately rather than waiting a frame.
    [_bridge _immediatelyCallTimer:callbackID];
    return;
  }

  NSTimeInterval jsSchedulingOverhead = MAX(-jsSchedulingTime.timeIntervalSinceNow, 0);

  NSTimeInterval targetTime = jsDuration - jsSchedulingOverhead;
  if (jsDuration < 0.018) { // Make sure short intervals run each frame
    jsDuration = 0;
  }

  _RCTTimer *timer = [[_RCTTimer alloc] initWithCallbackID:callbackID
                                                  interval:jsDuration
                                                targetTime:targetTime
                                                   repeats:repeats];
  _timers[callbackID] = timer;
  if (_paused) {
    if ([timer.target timeIntervalSinceNow] > kMinimumSleepInterval) {
      [self scheduleSleepTimer:timer.target];
    } else {
      [self startTimers];
    }
  }
}

RCT_EXPORT_METHOD(deleteTimer:(nonnull NSNumber *)timerID)
{
  [_timers removeObjectForKey:timerID];
  if (![self hasPendingTimers]) {
    [self stopTimers];
  }
}

RCT_EXPORT_METHOD(setSendIdleEvents:(BOOL)sendIdleEvents)
{
  _sendIdleEvents = sendIdleEvents;
  if (sendIdleEvents) {
    [self startTimers];
  } else if (![self hasPendingTimers]) {
    [self stopTimers];
  }
}

@end
