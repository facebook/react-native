/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTFrameUpdate.h>
#import <React/RCTInvalidating.h>

@protocol RCTTimingDelegate

- (void)callTimers:(NSArray<NSNumber *> *)timers;
- (void)immediatelyCallTimer:(nonnull NSNumber *)callbackID;
- (void)callIdleCallbacks:(nonnull NSNumber *)absoluteFrameStartMS;

@end

@interface RCTTiming : NSObject <RCTBridgeModule, RCTInvalidating, RCTFrameUpdateObserver>

- (instancetype)initWithDelegate:(id<RCTTimingDelegate>) delegate;
- (void)createTimerForNextFrame:(nonnull NSNumber *)callbackID
                       duration:(NSTimeInterval)jsDuration
               jsSchedulingTime:(NSDate *)jsSchedulingTime
                        repeats:(BOOL)repeats;
- (void)deleteTimer:(double)timerID;

@end

