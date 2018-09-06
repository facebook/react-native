/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <React/RCTDefines.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Returns if two edge insets are equal with `threshold` for epsilon.
 */
RCT_EXTERN BOOL RCTUIEdgeInsetsEqualToEdgeInsetsWithThreshold(UIEdgeInsets insets1, UIEdgeInsets insets2, CGFloat threshold);

/**
 * Returns the safe area insets for a view with a polyfill for ios < 11.
 */
RCT_EXTERN UIEdgeInsets RCTSafeAreaInsetsForView(UIView *view, BOOL emulateUnlessSupported);

NS_ASSUME_NONNULL_END
