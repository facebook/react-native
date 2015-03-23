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

@implementation RCTUIActivityIndicatorViewManager

- (UIView *)view
{
  return [[UIActivityIndicatorView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(activityIndicatorViewStyle)
RCT_EXPORT_VIEW_PROPERTY(color)
RCT_CUSTOM_VIEW_PROPERTY(animating, UIActivityIndicatorView)
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
