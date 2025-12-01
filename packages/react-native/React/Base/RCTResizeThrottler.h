/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTResizeThrottler : NSObject

// Block to call when an update should be applied
@property (nonatomic, copy) void (^updateBlock)(CGFloat width, CGFloat height);

// Absolute pixel threshold, updates above which will be applied immediately
@property (nonatomic, assign) CGFloat pixelThreshold;

// Update for the trailing edge of changes (in seconds); last event that was filtered by the threshold criterion will be
// applied after this delay
@property (nonatomic, assign) NSTimeInterval trailingDelay;

- (instancetype)initWithTrailingDelay:(CGFloat)delay;

- (instancetype)initWithTrailingDelay:(CGFloat)delay pixelThreshold:(CGFloat)threshold;

// Call this whenever the source size changes
- (void)sourceSizeChangedToWidth:(CGFloat)width height:(CGFloat)height;

// Cancel any pending trailing update
- (void)invalidate;

@end

NS_ASSUME_NONNULL_END
