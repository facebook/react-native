/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTColorSpaceUtils.h"

#import <react/renderer/graphics/ColorComponents.h>

@implementation RCTColorSpaceUtils

+ (void)applyDefaultColorSpace:(RCTColorSpace)colorSpace
{
  facebook::react::ColorSpace cxxColorSpace =
      colorSpace == RCTColorSpaceSRGB ? facebook::react::ColorSpace::sRGB : facebook::react::ColorSpace::DisplayP3;

  RCTSetDefaultColorSpace(colorSpace);
  facebook::react::setDefaultColorSpace(cxxColorSpace);
}

@end
