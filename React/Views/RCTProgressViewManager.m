/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTProgressViewManager.h"

#import "RCTConvert.h"

@implementation RCTConvert (RCTProgressViewManager)

RCT_ENUM_CONVERTER(
    UIProgressViewStyle,
    (@{
      @"default" : @(UIProgressViewStyleDefault),
      @"bar" : @(UIProgressViewStyleBar),
    }),
    UIProgressViewStyleDefault,
    integerValue)

@end

@implementation RCTProgressViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  RCTNewArchitectureValidationPlaceholder(
      RCTNotAllowedInFabricWithoutLegacy,
      self,
      @"This native component is still using the legacy interop layer -- please migrate it to use a Fabric specific implementation.");
  return [UIProgressView new];
}

RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
RCT_EXPORT_VIEW_PROPERTY(progress, float)
RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

@end
