/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSafeAreaUtils.h"

#import <React/UIView+React.h>

BOOL RCTUIEdgeInsetsEqualToEdgeInsetsWithThreshold(UIEdgeInsets insets1, UIEdgeInsets insets2, CGFloat threshold)
{
  return
    ABS(insets1.left - insets2.left) <= threshold &&
    ABS(insets1.right - insets2.right) <= threshold &&
    ABS(insets1.top - insets2.top) <= threshold &&
    ABS(insets1.bottom - insets2.bottom) <= threshold;
}

UIEdgeInsets RCTSafeAreaInsetsForView(UIView *view, BOOL emulateUnlessSupported)
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
  if (@available(iOS 11, *)) {
    return view.safeAreaInsets;
  }
#endif

  if (!emulateUnlessSupported) {
    return UIEdgeInsetsZero;
  }

  UIViewController* vc = view.reactViewController;
  if (!vc) {
    return UIEdgeInsetsZero;
  }

  CGFloat topLayoutOffset = vc.topLayoutGuide.length;
  CGFloat bottomLayoutOffset = vc.bottomLayoutGuide.length;
  CGRect safeArea = vc.view.bounds;
  safeArea.origin.y += topLayoutOffset;
  safeArea.size.height -= topLayoutOffset + bottomLayoutOffset;
  CGRect localSafeArea = [vc.view convertRect:safeArea toView:view];
  UIEdgeInsets safeAreaInsets = UIEdgeInsetsMake(0, 0, 0, 0);
  if (CGRectGetMinY(localSafeArea) > CGRectGetMinY(view.bounds)) {
    safeAreaInsets.top = CGRectGetMinY(localSafeArea) - CGRectGetMinY(view.bounds);
  }
  if (CGRectGetMaxY(localSafeArea) < CGRectGetMaxY(view.bounds)) {
    safeAreaInsets.bottom = CGRectGetMaxY(view.bounds) - CGRectGetMaxY(localSafeArea);
  }

  return safeAreaInsets;
}
