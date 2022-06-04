/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSlider.h"

@implementation RCTSlider {
  float _unclippedValue;
}

- (void)setValue:(float)value
{
  _unclippedValue = value;
  super.value = value;
}

- (void)setMinimumValue:(float)minimumValue
{
  super.minimumValue = minimumValue;
  super.value = _unclippedValue;
}

- (void)setMaximumValue:(float)maximumValue
{
  super.maximumValue = maximumValue;
  super.value = _unclippedValue;
}

- (void)setTrackImage:(UIImage *)trackImage
{
  if (trackImage != _trackImage) {
    _trackImage = trackImage;
    CGFloat width = trackImage.size.width / 2;
    UIImage *minimumTrackImage = [trackImage resizableImageWithCapInsets:(UIEdgeInsets){0, width, 0, width}
                                                            resizingMode:UIImageResizingModeStretch];
    UIImage *maximumTrackImage = [trackImage resizableImageWithCapInsets:(UIEdgeInsets){0, width, 0, width}
                                                            resizingMode:UIImageResizingModeStretch];
    [self setMinimumTrackImage:minimumTrackImage forState:UIControlStateNormal];
    [self setMaximumTrackImage:maximumTrackImage forState:UIControlStateNormal];
  }
}

- (void)setMinimumTrackImage:(UIImage *)minimumTrackImage
{
  _trackImage = nil;
  minimumTrackImage =
      [minimumTrackImage resizableImageWithCapInsets:(UIEdgeInsets){0, minimumTrackImage.size.width, 0, 0}
                                        resizingMode:UIImageResizingModeStretch];
  [self setMinimumTrackImage:minimumTrackImage forState:UIControlStateNormal];
}

- (UIImage *)minimumTrackImage
{
  return [self thumbImageForState:UIControlStateNormal];
}

- (void)setMaximumTrackImage:(UIImage *)maximumTrackImage
{
  _trackImage = nil;
  maximumTrackImage =
      [maximumTrackImage resizableImageWithCapInsets:(UIEdgeInsets){0, 0, 0, maximumTrackImage.size.width}
                                        resizingMode:UIImageResizingModeStretch];
  [self setMaximumTrackImage:maximumTrackImage forState:UIControlStateNormal];
}

- (UIImage *)maximumTrackImage
{
  return [self thumbImageForState:UIControlStateNormal];
}

- (void)setThumbImage:(UIImage *)thumbImage
{
  [self setThumbImage:thumbImage forState:UIControlStateNormal];
}

- (UIImage *)thumbImage
{
  return [self thumbImageForState:UIControlStateNormal];
}

- (void)accessibilityIncrement
{
  [super accessibilityIncrement];
  if (_onSlidingComplete) {
    _onSlidingComplete(@{
      @"value" : @(self.value),
    });
  }
}

- (void)accessibilityDecrement
{
  [super accessibilityDecrement];
  if (_onSlidingComplete) {
    _onSlidingComplete(@{
      @"value" : @(self.value),
    });
  }
}

@end
