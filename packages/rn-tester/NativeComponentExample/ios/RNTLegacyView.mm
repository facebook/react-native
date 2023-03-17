/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNTLegacyView.h"

@implementation RNTLegacyView

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  super.backgroundColor = backgroundColor;
  [self emitEvent];
}

- (void)emitEvent
{
  if (!self.onColorChanged) {
    return;
  }
  CGFloat hue = 0.0;
  CGFloat saturation = 0.0;
  CGFloat brightness = 0.0;
  CGFloat alpha = 0.0;
  [self.backgroundColor getHue:&hue saturation:&saturation brightness:&brightness alpha:&alpha];
  self.onColorChanged(@{
    @"backgroundColor" :
        @{@"hue" : @(hue), @"saturation" : @(saturation), @"brightness" : @(brightness), @"alpha" : @(alpha)}
  });
}

@end
