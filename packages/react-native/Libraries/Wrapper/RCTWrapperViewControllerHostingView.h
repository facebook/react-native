/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

NS_ASSUME_NONNULL_BEGIN

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTWrapperViewControllerHostingView : UIView

@property (nonatomic, retain, nullable) UIViewController *contentViewController;

#pragma mark - Restrictions

- (void)addSubview:(UIView *)view NS_UNAVAILABLE;
- (void)insertSubview:(UIView *)view atIndex:(NSInteger)index NS_UNAVAILABLE;
- (void)insertSubview:(UIView *)view aboveSubview:(UIView *)siblingSubview NS_UNAVAILABLE;
- (void)insertSubview:(UIView *)view belowSubview:(UIView *)siblingSubview NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END

#endif // RCT_REMOVE_LEGACY_ARCH
