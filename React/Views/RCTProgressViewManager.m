/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTProgressViewManager.h"

#import "RCTConvert.h"
#import "RCTProgressView.h" // TODO(macOS GH#774)

@implementation RCTConvert (RCTProgressViewManager)

#if TARGET_OS_OSX // [TODO(macOS GH#774)
RCT_ENUM_CONVERTER(NSProgressIndicatorStyle, (@{
  @"default": @(NSProgressIndicatorStyleBar),
  @"bar": @(NSProgressIndicatorStyleBar),
}), NSProgressIndicatorStyleBar, integerValue)
#else // ]TODO(macOS GH#774)
RCT_ENUM_CONVERTER(
    UIProgressViewStyle,
    (@{
      @"default" : @(UIProgressViewStyleDefault),
      @"bar" : @(UIProgressViewStyleBar),
    }),
    UIProgressViewStyleDefault,
    integerValue)
#endif // TODO(macOS GH#774)

@end

@implementation RCTProgressViewManager

RCT_EXPORT_MODULE()

- (RCTPlatformView *)view // TODO(macOS GH#774)
{
  return [RCTProgressView new]; // TODO(macOS GH#774)
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)
RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
RCT_EXPORT_VIEW_PROPERTY(progress, float)
#else // [TODO(macOS GH#774)
RCT_EXPORT_VIEW_PROPERTY(style, NSProgressIndicatorStyle)
RCT_REMAP_VIEW_PROPERTY(progress, doubleValue, double)
#endif // ]TODO(macOS GH#774)
RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

@end
