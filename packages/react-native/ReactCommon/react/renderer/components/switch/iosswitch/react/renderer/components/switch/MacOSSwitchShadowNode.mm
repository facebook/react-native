/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <AppKit/AppKit.h>
#include "AppleSwitchShadowNode.h"

namespace facebook::react {

extern const char AppleSwitchComponentName[] = "Switch";

#pragma mark - LayoutableShadowNode

Size SwitchShadowNode::measureContent(
    const LayoutContext & /*layoutContext*/,
    const LayoutConstraints & /*layoutConstraints*/) const
{
  static CGSize nsSwitchSize = CGSizeZero;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    dispatch_sync(dispatch_get_main_queue(), ^{
      nsSwitchSize = [NSSwitch new].intrinsicContentSize;
    });
  });

  return {.width = nsSwitchSize.width, .height = nsSwitchSize.height};
}

} // namespace facebook::react
