/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTResizeThrottler.h"

#import "RCTUtils.h"

@interface RCTResizeThrottler ()
@property (nonatomic, assign) CGFloat lastAppliedWidth;
@property (nonatomic, assign) CGFloat lastSourceSizeChangedWidth;
@property (nonatomic, assign) CGFloat lastSourceSizeChangedHeight;
@property (nonatomic, strong, nullable) NSTimer *scheduledTrailingTimer;
@end

@implementation RCTResizeThrottler

- (instancetype)init
{
  self = [super init];
  if (self) {
    dispatch_sync(dispatch_get_main_queue(), ^{
      _pixelThreshold = fmin(RCTKeyWindow().frame.size.width, RCTKeyWindow().frame.size.height) * 0.02;
    });
    _trailingDelay = 0;
    _lastAppliedWidth = 0;
    _lastSourceSizeChangedWidth = 0;
    _lastSourceSizeChangedHeight = 0;
  }
  return self;
}

- (instancetype)initWithTrailingDelay:(CGFloat)delay
{
  self = [super init];
  if (self) {
    _trailingDelay = delay;
  }
  return self;
}

- (instancetype)initWithTrailingDelay:(CGFloat)delay pixelThreshold:(CGFloat)threshold
{
  self = [super init];
  if (self) {
    _trailingDelay = delay;
    _pixelThreshold = threshold;
  }
  return self;
}

- (void)sourceSizeChangedToWidth:(CGFloat)width height:(CGFloat)height
{
  if (width != self.lastSourceSizeChangedWidth || height != self.lastSourceSizeChangedHeight) {
    if (fabs(width - self.lastAppliedWidth) >= self.pixelThreshold) {
      // update immediately if px threshold is exceeded
      [self.scheduledTrailingTimer invalidate];
      self.scheduledTrailingTimer = nil;
      [self applyUpdateWidth:width height:height];
    } else {
      // if filtered out, schedule trailing update also clearing any possible previous one
      [self.scheduledTrailingTimer invalidate];
      __weak __typeof(self) weakSelf = self;
      self.scheduledTrailingTimer = [NSTimer scheduledTimerWithTimeInterval:self.trailingDelay
                                                                    repeats:NO
                                                                      block:^(NSTimer *_Nonnull timer) {
                                                                        [weakSelf applyUpdateWidth:width height:height];
                                                                        weakSelf.scheduledTrailingTimer = nil;
                                                                      }];
    }
    self.lastSourceSizeChangedWidth = width;
    self.lastSourceSizeChangedHeight = height;
  }
}

- (void)applyUpdateWidth:(CGFloat)width height:(CGFloat)height
{
  if (self.updateBlock) {
    self.updateBlock(width, height);
  }
  self.lastAppliedWidth = width;
}

- (void)invalidate
{
  if (self.scheduledTrailingTimer != nil) {
    return;
  }
  [self.scheduledTrailingTimer invalidate];
  self.scheduledTrailingTimer = nil;
}

@end
