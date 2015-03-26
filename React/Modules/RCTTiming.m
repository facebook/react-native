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
#import "RCTLog.h"
#import "RCTSparseArray.h"
#import "RCTUtils.h"

@interface RCTTimer : NSObject

@property (nonatomic, strong, readonly) NSDate *target;
@property (nonatomic, assign, readonly) BOOL repeats;
@property (nonatomic, copy, readonly) NSNumber *callbackID;
@property (nonatomic, assign, readonly) NSTimeInterval interval;

@end

@implementation RCTTimer

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

@implementation RCTTiming
{
  RCTSparseArray *_timers;
  id _updateTimer;
}

@synthesize bridge = _bridge;

+ (NSArray *)JSMethods
{
  return @[@"RCTJSTimers.callTimers"];
}

- (instancetype)init
{
  if ((self = [super init])) {

    _timers = [[RCTSparseArray alloc] init];

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
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (BOOL)isValid
{
  return _bridge != nil;
}

- (void)invalidate
{
  [self stopTimers];
  _bridge = nil;
}

- (void)stopTimers
{
  [_updateTimer invalidate];
  _updateTimer = nil;
}

- (void)startTimers
{
  RCTAssertMainThread();

  if (![self isValid] || _updateTimer != nil || _timers.count == 0) {
    return;
  }

  _updateTimer = [CADisplayLink displayLinkWithTarget:self selector:@selector(update)];
  if (_updateTimer) {
    [_updateTimer addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSDefaultRunLoopMode];
  } else {
    RCTLogWarn(@"Failed to create a display link (probably on buildbot) - using an NSTimer for AppEngine instead.");
    _updateTimer = [NSTimer scheduledTimerWithTimeInterval:(1.0 / 60)
                                                    target:self
                                                  selector:@selector(update)
                                                  userInfo:nil
                                                   repeats:YES];
  }
}

- (void)update
{
  RCTAssertMainThread();

  NSMutableArray *timersToCall = [[NSMutableArray alloc] init];
  for (RCTTimer *timer in _timers.allObjects) {
    if ([timer updateFoundNeedsJSUpdate]) {
      [timersToCall addObject:timer.callbackID];
    }
    if (!timer.target) {
      _timers[timer.callbackID] = nil;
    }
  }

  // call timers that need to be called
  if ([timersToCall count] > 0) {
    [_bridge enqueueJSCall:@"RCTJSTimers.callTimers" args:@[timersToCall]];
  }
}

/**
 * There's a small difference between the time when we call
 * setTimeout/setInterval/requestAnimation frame and the time it actually makes
 * it here. This is important and needs to be taken into account when
 * calculating the timer's target time. We calculate this by passing in
 * Date.now() from JS and then subtracting that from the current time here.
 */
- (void)createTimer:(NSNumber *)callbackID
           duration:(double)jsDuration
   jsSchedulingTime:(double)jsSchedulingTime
            repeats:(BOOL)repeats
{
  RCT_EXPORT();

  if (jsDuration == 0 && repeats == NO) {
    // For super fast, one-off timers, just enqueue them immediately rather than waiting a frame.
    [_bridge enqueueJSCall:@"RCTJSTimers.callTimers" args:@[@[callbackID]]];
    return;
  }

  NSTimeInterval interval = jsDuration / 1000;
  NSTimeInterval jsCreationTimeSinceUnixEpoch = jsSchedulingTime / 1000;
  NSTimeInterval currentTimeSinceUnixEpoch = [[NSDate date] timeIntervalSince1970];
  NSTimeInterval jsSchedulingOverhead = currentTimeSinceUnixEpoch - jsCreationTimeSinceUnixEpoch;
  if (jsSchedulingOverhead < 0) {
    RCTLogWarn(@"jsSchedulingOverhead (%ims) should be positive", (int)(jsSchedulingOverhead * 1000));
  }

  NSTimeInterval targetTime = interval - jsSchedulingOverhead;
  if (interval < 0.018) { // Make sure short intervals run each frame
    interval = 0;
  }

  RCTTimer *timer = [[RCTTimer alloc] initWithCallbackID:callbackID
                                                interval:interval
                                              targetTime:targetTime
                                                 repeats:repeats];
  dispatch_async(dispatch_get_main_queue(), ^{
    _timers[callbackID] = timer;
    [self startTimers];
  });
}

- (void)deleteTimer:(NSNumber *)timerID
{
  RCT_EXPORT();

  if (timerID) {
    dispatch_async(dispatch_get_main_queue(), ^{
      _timers[timerID] = nil;
      if (_timers.count == 0) {
        [self stopTimers];
      }
    });
  } else {
    RCTLogWarn(@"Called deleteTimer: with a nil timerID");
  }
}

@end
