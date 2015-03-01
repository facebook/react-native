// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTUIActivityIndicatorViewManager.h"

#import "RCTConvert.h"

@implementation RCTUIActivityIndicatorViewManager

- (UIView *)view
{
  return [[UIActivityIndicatorView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(activityIndicatorViewStyle)
RCT_EXPORT_VIEW_PROPERTY(color)
RCT_CUSTOM_VIEW_PROPERTY(animating, UIActivityIndicatorView *)
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
