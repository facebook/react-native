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
  return {.width = uiSwitchSize.width, .height = uiSwitchSize.height};
}

} // namespace facebook::react
