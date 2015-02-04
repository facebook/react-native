// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTTiming.h"

#import "RCTBridge.h"
#import "RCTLog.h"
#import "RCTModuleIDs.h"
#import "RCTSparseArray.h"
#import "RCTUtils.h"

@interface RCTTimer : NSObject

@property (nonatomic, strong, readonly) NSDate *target;
@property (nonatomic, assign, readonly, getter=isActive) BOOL active;
@property (nonatomic, assign, readonly) BOOL repeats;
@property (nonatomic, strong, readonly) NSNumber *callbackID;
@property (nonatomic, assign, readonly) NSTimeInterval interval;

@end

@implementation RCTTimer

- (instancetype)initWithCallbackID:(NSNumber *)callbackID
                          interval:(NSTimeInterval)interval
                        targetTime:(NSTimeInterval)targetTime
                           repeats:(BOOL)repeats
{
  if ((self = [super init])) {
    _active = YES;
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
  if (_active && _target.timeIntervalSinceNow <= 0) {
    // The JS Timers will do fine grained calculating of expired timeouts.
    if (_repeats) {
      _target = [NSDate dateWithTimeIntervalSinceNow:_interval];
    } else {
      _active = NO;
    }
    return YES;
  }
  return NO;
}

@end

@implementation RCTTiming
{
  RCTSparseArray *_timers;
  RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if ((self = [super init])) {
    _bridge = bridge;
    _timers = [[RCTSparseArray alloc] init];
  }
  return self;
}

/**
 * TODO (#5906496): Wait until operations on `javaScriptQueue` are complete to complete the
 * `dealloc`.
 */
/* - (void)dealloc
 {
 } */

- (void)enqueueUpdateTimers
{
  RCTAssertMainThread();
  
  NSMutableArray *timersToCall = [[NSMutableArray alloc] init];
  for (RCTTimer *timer in _timers.allObjects) {
    if ([timer updateFoundNeedsJSUpdate]) {
      [timersToCall addObject:timer.callbackID];
    }
    if (!timer.active) {
      _timers[timer.callbackID] = nil;
    }
  }
  
  // call timers that need to be called
  if ([timersToCall count] > 0) {
    [_bridge enqueueJSCall:RCTModuleIDJSTimers methodID:RCTJSTimersCallTimers args:@[timersToCall]];
  }
}

- (void)scheduleCallbackID:(NSNumber *)callbackID interval:(NSTimeInterval)interval targetTime:(NSTimeInterval)targetTime repeats:(BOOL)repeats
{
  dispatch_async(dispatch_get_main_queue(), ^{
    RCTTimer *timer = [[RCTTimer alloc] initWithCallbackID:callbackID interval:interval targetTime:targetTime repeats:repeats];
    _timers[callbackID] = timer;
  });
}

/**
 * There's a small difference between the time when we call
 * setTimeout/setInterval/requestAnimation frame and the time it actually makes
 * it here. This is important and needs to be taken into account when
 * calculating the timer's target time. We calculate this by passing in
 * Date.now() from JS and then subtracting that from the current time here.
 */
- (void)createTimer:(NSNumber *)callbackID
           duration:(NSNumber *)jsDuration
   jsSchedulingTime:(NSNumber *)jsSchedulingTime
            repeats:(NSNumber *)repeats
{
  RCT_EXPORT();

  NSTimeInterval interval = jsDuration.doubleValue / 1000;
  NSTimeInterval jsCreationTimeSinceUnixEpoch = jsSchedulingTime.doubleValue / 1000;
  NSTimeInterval currentTimeSinceUnixEpoch = [[NSDate date] timeIntervalSince1970];
  NSTimeInterval jsSchedulingOverhead = currentTimeSinceUnixEpoch - jsCreationTimeSinceUnixEpoch;
  if (jsSchedulingOverhead < 0) {
    RCTLogWarn(@"jsSchedulingOverhead (%ims) should be positive", (int)(jsSchedulingOverhead * 1000));
  }
  
  NSTimeInterval targetTime = interval - jsSchedulingOverhead;
  if (interval < 0.018) { // Make sure short intervals run each frame
    interval = 0;
  }
  
  [self scheduleCallbackID:callbackID
                  interval:interval
                targetTime:targetTime
                   repeats:repeats.boolValue];
}

- (void)deleteTimer:(NSNumber *)timerID
{
  RCT_EXPORT();

  if (timerID) {
    dispatch_async(dispatch_get_main_queue(), ^{
      _timers[timerID] = nil;
    });
  } else {
    RCTLogWarn(@"Called deleteTimer: with a nil timerID");
  }
}

@end
