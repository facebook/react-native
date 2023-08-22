/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAccessibilityElement.h"

@implementation RCTAccessibilityElement

#if !TARGET_OS_OSX // [macOS]
- (CGRect)accessibilityFrame
{
  RCTUIView *container = (RCTUIView *)self.accessibilityContainer; // [macOS]
  if (CGRectEqualToRect(_frame, CGRectZero)) {
    return UIAccessibilityConvertFrameToScreenCoordinates(container.bounds, container);
  } else {
    return UIAccessibilityConvertFrameToScreenCoordinates(_frame, container);
  }
}
#endif // [macOS]

@end
