/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <React/RCTVirtualViewMode.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RCTVirtualViewProtocol <NSObject>

@property (nonatomic, copy, readonly) NSString *virtualViewID;

- (CGRect)containerRelativeRect:(UIView *)view;
- (void)onModeChange:(RCTVirtualViewMode)newMode targetRect:(CGRect)targetRect thresholdRect:(CGRect)thresholdRect;
@end

NS_ASSUME_NONNULL_END
