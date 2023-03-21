/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTProgressViewManager.h"

#import "RCTConvert.h"
#import "RCTProgressView.h" // [macOS]

@implementation RCTConvert (RCTProgressViewManager)

#if !TARGET_OS_OSX // [macOS]
RCT_ENUM_CONVERTER(
    UIProgressViewStyle,
    (@{
      @"default" : @(UIProgressViewStyleDefault),
      @"bar" : @(UIProgressViewStyleBar),
    }),
    UIProgressViewStyleDefault,
    integerValue)
#else // [macOS
RCT_ENUM_CONVERTER(NSProgressIndicatorStyle, (@{
  @"default": @(NSProgressIndicatorStyleBar),
  @"bar": @(NSProgressIndicatorStyleBar),
}), NSProgressIndicatorStyleBar, integerValue)
#endif // macOS]

@end

@implementation RCTProgressViewManager

RCT_EXPORT_MODULE()

- (RCTPlatformView *)view // [macOS]
{
  RCTNewArchitectureValidationPlaceholder(
      RCTNotAllowedInFabricWithoutLegacy,
      self,
      @"This native component is still using the legacy interop layer -- please migrate it to use a Fabric specific implementation.");
  return [RCTProgressView new]; // [macOS]
}

#if !TARGET_OS_OSX // [macOS]
RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
RCT_EXPORT_VIEW_PROPERTY(progress, float)
#else // [macOS
RCT_EXPORT_VIEW_PROPERTY(style, NSProgressIndicatorStyle)
RCT_REMAP_VIEW_PROPERTY(progress, doubleValue, double)
#endif // macOS]
RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

@end
