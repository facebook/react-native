/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSlider.h"

@implementation RCTSlider
{
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
  [self setMinimumTrackImage:trackImage forState:UIControlStateNormal];
  [self setMaximumTrackImage:trackImage forState:UIControlStateNormal];
}

- (UIImage *)trackImage
{
  return [self thumbImageForState:UIControlStateNormal];
}

- (void)setMinimumTrackImage:(UIImage *)minimumTrackImage
{
  [self setMinimumTrackImage:minimumTrackImage forState:UIControlStateNormal];
}

- (UIImage *)minimumTrackImage
{
  return [self thumbImageForState:UIControlStateNormal];
}

- (void)setMaximumTrackImage:(UIImage *)maximumTrackImage
{
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

@end
