/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewUtils.h"

#import "UIView+React.h"

UIEdgeInsets RCTContentInsets(RCTPlatformView *view) // [macOS]
{
#if !TARGET_OS_OSX // [macOS]
  while (view) {
    UIViewController *controller = view.reactViewController;
    if (controller) {
      return controller.view.safeAreaInsets;
    }
    view = view.superview;
  }
#endif // [macOS]
  return UIEdgeInsetsZero;
}
