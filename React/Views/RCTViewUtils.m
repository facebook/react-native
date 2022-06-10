/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewUtils.h"

#import "UIView+React.h"

UIEdgeInsets RCTContentInsets(RCTPlatformView *view) // TODO(macOS GH#774)
{
#if !TARGET_OS_OSX // [TODO(macOS GH#774)
  while (view) {
    UIViewController *controller = view.reactViewController;
    if (controller) {
      return controller.view.safeAreaInsets;
    }
    view = view.superview;
  }
#endif // ]TODO(macOS GH#774)
  return UIEdgeInsetsZero;
}
