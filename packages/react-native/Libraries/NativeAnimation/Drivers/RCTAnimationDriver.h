/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>

#ifdef __cplusplus
#include <react/featureflags/ReactNativeFeatureFlags.h>

static CGFloat RCTSingleFrameInterval(void)
{
  if (facebook::react::ReactNativeFeatureFlags::disableHighRefreshRateAnimations()) {
    // Fallback to 60 fps if disabled.
    return 1.0 / 60;
  }
  
  static CGFloat maximumFramesPerSecond;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    RCTUnsafeExecuteOnMainQueueSync(^{
      maximumFramesPerSecond = [UIScreen mainScreen].maximumFramesPerSecond;
    });
  });

  return 1.0 / maximumFramesPerSecond;
};

#endif

@class RCTValueAnimatedNode;

NS_ASSUME_NONNULL_BEGIN

@protocol RCTAnimationDriver <NSObject>

@property (nonatomic, readonly) NSNumber *animationId;
@property (nonatomic, readonly) RCTValueAnimatedNode *valueNode;
@property (nonatomic, readonly) BOOL animationHasBegun;
@property (nonatomic, readonly) BOOL animationHasFinished;

- (instancetype)initWithId:(NSNumber *)animationId
                    config:(NSDictionary *)config
                   forNode:(RCTValueAnimatedNode *)valueNode
                  callBack:(nullable RCTResponseSenderBlock)callback;

- (void)startAnimation;
- (void)stepAnimationWithTime:(NSTimeInterval)currentTime;
- (void)stopAnimation;
- (void)resetAnimationConfig:(NSDictionary *)config;

NS_ASSUME_NONNULL_END

@end
