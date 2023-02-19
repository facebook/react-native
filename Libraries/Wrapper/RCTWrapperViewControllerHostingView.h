/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

NS_ASSUME_NONNULL_BEGIN

@interface RCTWrapperViewControllerHostingView : RCTPlatformView // [macOS]

#if !TARGET_OS_OSX // [macOS]
@property (nonatomic, retain, nullable) UIViewController *contentViewController;
#else
@property (nonatomic, retain, nullable) NSViewController *contentViewController;
#endif // [macOS]

#pragma mark - Restrictions

- (void)addSubview:(RCTPlatformView *)view NS_UNAVAILABLE; // [macOS]
- (void)insertSubview:(RCTPlatformView *)view atIndex:(NSInteger)index NS_UNAVAILABLE; // [macOS]
- (void)insertSubview:(RCTPlatformView *)view aboveSubview:(UIView *)siblingSubview NS_UNAVAILABLE; // [macOS]
- (void)insertSubview:(RCTPlatformView *)view belowSubview:(RCTPlatformView *)siblingSubview NS_UNAVAILABLE; // [macOS]

@end

NS_ASSUME_NONNULL_END
