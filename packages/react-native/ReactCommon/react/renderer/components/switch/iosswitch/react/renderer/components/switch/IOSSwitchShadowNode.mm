/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUtils.h>
#import <UIKit/UIKit.h>
#include "AppleSwitchShadowNode.h"

namespace facebook::react {

extern const char AppleSwitchComponentName[] = "Switch";

#pragma mark - LayoutableShadowNode

Size SwitchShadowNode::measureContent(
    const LayoutContext & /*layoutContext*/,
    const LayoutConstraints & /*layoutConstraints*/) const
{
  CGSize uiSwitchSize = RCTSwitchSize();
  // Apple has some error when returning the width of the component and it doesn't
  // account for the borders.
  return {.width = uiSwitchSize.width + 2, .height = uiSwitchSize.height};
}

} // namespace facebook::react
