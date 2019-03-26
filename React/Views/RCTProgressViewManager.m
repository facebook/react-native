/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTProgressViewManager.h"

#import "RCTConvert.h"
#import "RCTProgressView.h" // TODO(macOS ISS#2323203)

@implementation RCTConvert (RCTProgressViewManager)

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
RCT_ENUM_CONVERTER(NSProgressIndicatorStyle, (@{
  @"default": @(NSProgressIndicatorBarStyle),
  @"bar": @(NSProgressIndicatorBarStyle),
}), NSProgressIndicatorBarStyle, integerValue)
#else // ]TODO(macOS ISS#2323203)
RCT_ENUM_CONVERTER(UIProgressViewStyle, (@{
  @"default": @(UIProgressViewStyleDefault),
#if !TARGET_OS_TV
  @"bar": @(UIProgressViewStyleBar),
#endif
}), UIProgressViewStyleDefault, integerValue)
#endif // TODO(macOS ISS#2323203)

@end

@implementation RCTProgressViewManager

RCT_EXPORT_MODULE()

- (RCTPlatformView *)view // TODO(macOS ISS#2323203)
{
  return [RCTProgressView new]; // TODO(macOS ISS#2323203)
}

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
RCT_EXPORT_VIEW_PROPERTY(progress, float)
#else // [TODO(macOS ISS#2323203)
RCT_EXPORT_VIEW_PROPERTY(style, NSProgressIndicatorStyle)
RCT_REMAP_VIEW_PROPERTY(progress, doubleValue, double)
#endif // ]TODO(macOS ISS#2323203)
RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

@end
