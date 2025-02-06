/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ObjCTimerRegistry.h"

@implementation RCTJSTimerExecutor {
  std::weak_ptr<facebook::react::TimerManager> _timerManager;
}

- (void)setTimerManager:(std::weak_ptr<facebook::react::TimerManager>)timerManager
{
  _timerManager = timerManager;
}

- (void)callTimers:(NSArray<NSNumber *> *)timers
{
  if (auto timerManager = _timerManager.lock()) {
    for (NSNumber *timer in timers) {
      timerManager->callTimer([timer unsignedIntValue]);
    }
  }
}

- (void)immediatelyCallTimer:(nonnull NSNumber *)callbackID
{
  if (auto timerManager = _timerManager.lock()) {
    timerManager->callTimer([callbackID unsignedIntValue]);
  }
}

- (void)callIdleCallbacks:(nonnull NSNumber *)absoluteFrameStartMS
{
  // TODO(T53992765)(petetheheat) - Implement this
}

@end

ObjCTimerRegistry::ObjCTimerRegistry()
{
  jsTimerExecutor_ = [RCTJSTimerExecutor new];
  timing = [[RCTTiming alloc] initWithDelegate:jsTimerExecutor_];
}

void ObjCTimerRegistry::createTimer(uint32_t timerID, double delayMS)
{
  [timing createTimerForNextFrame:@(timerID) duration:toSeconds(delayMS) jsSchedulingTime:nil repeats:NO];
}

void ObjCTimerRegistry::deleteTimer(uint32_t timerID)
{
  [timing deleteTimer:(double)timerID];
}

void ObjCTimerRegistry::createRecurringTimer(uint32_t timerID, double delayMS)
{
  [timing createTimerForNextFrame:@(timerID) duration:toSeconds(delayMS) jsSchedulingTime:nil repeats:YES];
}

void ObjCTimerRegistry::setTimerManager(std::weak_ptr<facebook::react::TimerManager> timerManager)
{
  [jsTimerExecutor_ setTimerManager:timerManager];
}

// ObjC timing native module expects a NSTimeInterval which is always specified in seconds. JS expresses timer delay
// in ms. Perform a simple conversion here.
double ObjCTimerRegistry::toSeconds(double ms)
{
  return ms / 1000.0;
}
