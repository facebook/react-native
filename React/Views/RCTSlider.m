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
  if (trackImage != _trackImage) {
    _trackImage = trackImage;

    CGFloat width = trackImage.size.width;

    UIImage *minimumTrackImage = [trackImage resizableImageWithCapInsets:(UIEdgeInsets){0, width, 0, 0}];
    UIImage *maximumTrackImage = [trackImage resizableImageWithCapInsets:(UIEdgeInsets){0, 0, 0, width}];

    [super setMinimumTrackImage:minimumTrackImage forState:UIControlStateNormal];
    [super setMaximumTrackImage:maximumTrackImage forState:UIControlStateNormal];
  }
}

@end
