/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <AppKit/AppKit.h>
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
    NSSwitch *switchControl = [[NSSwitch alloc] init];
    cgsize = [switchControl intrinsicContentSize];
  });

  // For macOS, use the intrinsic size as-is
  iosSwitchSize = {.height = cgsize.height, .width = cgsize.width};

  return iosSwitchSize;
}

} // namespace facebook::react
