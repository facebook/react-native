/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTProgressViewManager.h"

#import "RCTConvert.h"

@implementation RCTConvert (RCTProgressViewManager)

RCT_ENUM_CONVERTER(UIProgressViewStyle, (@{
  @"default": @(UIProgressViewStyleDefault),
  @"bar": @(UIProgressViewStyleBar),
}), UIProgressViewStyleDefault, integerValue)

@end

@implementation RCTProgressViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[UIProgressView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
RCT_EXPORT_VIEW_PROPERTY(progress, float)
RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

- (NSDictionary *)constantsToExport
{
  UIProgressView *view = [[UIProgressView alloc] init];
  return @{
    @"ComponentHeight": @(view.intrinsicContentSize.height),
  };
}

@end
