/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTUIActivityIndicatorViewManager.h"

#import "RCTConvert.h"

@implementation RCTConvert (UIActivityIndicatorView)

RCT_ENUM_CONVERTER(UIActivityIndicatorViewStyle, (@{
  @"white-large": @(UIActivityIndicatorViewStyleWhiteLarge),
  @"large-white": @(UIActivityIndicatorViewStyleWhiteLarge),
  @"white": @(UIActivityIndicatorViewStyleWhite),
  @"gray": @(UIActivityIndicatorViewStyleGray),
}), UIActivityIndicatorViewStyleWhiteLarge, integerValue)

@end

@implementation RCTUIActivityIndicatorViewManager

RCT_EXPORT_MODULE(UIActivityIndicatorViewManager)

- (UIView *)view
{
  return [[UIActivityIndicatorView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(activityIndicatorViewStyle, UIActivityIndicatorViewStyle)
RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
RCT_CUSTOM_VIEW_PROPERTY(animating, BOOL, UIActivityIndicatorView)
{
  BOOL animating = json ? [json boolValue] : [defaultView isAnimating];
  if (animating != [view isAnimating]) {
    if (animating) {
      [view startAnimating];
    } else {
      [view stopAnimating];
    }
  }
}

- (NSDictionary *)constantsToExport
{
  return
  @{
    @"StyleWhite": @(UIActivityIndicatorViewStyleWhite),
    @"StyleWhiteLarge": @(UIActivityIndicatorViewStyleWhiteLarge),
    @"StyleGray": @(UIActivityIndicatorViewStyleGray),
  };
}

@end
