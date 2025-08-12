/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#include "AppleSwitchShadowNode.h"

namespace facebook::react {

extern const char IOSSwitchComponentName[] = "Switch";

#pragma mark - LayoutableShadowNode

Size SwitchShadowNode::measureContent(
    const LayoutContext & /*layoutContext*/,
    const LayoutConstraints &layoutConstraints) const
{
  if (iosSwitchSize.width != 0) {
    return iosSwitchSize;
  }
  // Let's cache the value of the SwitchSize the first time we compute it.
  __block CGSize cgsize;
  dispatch_sync(dispatch_get_main_queue(), ^{
    cgsize = [UISwitch new].intrinsicContentSize;
  });

  // The width returned by iOS is not exactly the width of the component.
  // For some reason, it is lacking 2 pixels. That can be seen clearly by setting a background
  // This is an iOS bug.
  iosSwitchSize = {.height = cgsize.height, .width = cgsize.width + 2};

  return iosSwitchSize;
}

} // namespace facebook::react
