/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTActivityIndicatorViewManager.h"

#import "RCTActivityIndicatorView.h"
#import "RCTConvert.h"

@implementation RCTConvert (UIActivityIndicatorView)

// NOTE: It's pointless to support UIActivityIndicatorViewStyleGray
// as we can set the color to any arbitrary value that we want to

RCT_ENUM_CONVERTER(
    UIActivityIndicatorViewStyle,
    (@{
      @"large" : @(UIActivityIndicatorViewStyleWhiteLarge),
      @"small" : @(UIActivityIndicatorViewStyleWhite),
    }),
    UIActivityIndicatorViewStyleWhiteLarge,
    integerValue)

@end

@implementation RCTActivityIndicatorViewManager

RCT_EXPORT_MODULE()

- (RCTPlatformView *)view // [macOS]
{
  return [RCTActivityIndicatorView new];
}

RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
RCT_EXPORT_VIEW_PROPERTY(hidesWhenStopped, BOOL)
RCT_CUSTOM_VIEW_PROPERTY(size, UIActivityIndicatorViewStyle, RCTActivityIndicatorView) // [macOS]
{
  /*
    Setting activityIndicatorViewStyle overrides the color, so restore the original color
    after setting the indicator style.
  */
  RCTUIColor *oldColor = view.color; // [macOS]
  view.activityIndicatorViewStyle =
      json ? [RCTConvert UIActivityIndicatorViewStyle:json] : defaultView.activityIndicatorViewStyle;
  view.color = oldColor;
}

RCT_CUSTOM_VIEW_PROPERTY(animating, BOOL, RCTActivityIndicatorView) // [macOS]
{
  BOOL animating = json ? [RCTConvert BOOL:json] : [defaultView isAnimating];
  if (animating != [view isAnimating]) {
    if (animating) {
      [view startAnimating];
    } else {
      [view stopAnimating];
    }
  }
}

@end
