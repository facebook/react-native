// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTNetworkImageViewManager.h"

#import "RCTNetworkImageView.h"

#import "RCTConvert.h"
#import "RCTUtils.h"

#import "RCTImageDownloader.h"

@implementation RCTNetworkImageViewManager

- (UIView *)view
{
  RCTNetworkImageView *view = [[RCTNetworkImageView alloc] initWithFrame:CGRectZero imageDownloader:[RCTImageDownloader sharedInstance]];
  view.contentMode = UIViewContentModeScaleAspectFill;
  return view;
}

RCT_REMAP_VIEW_PROPERTY(defaultImageSrc, defaultImage)
RCT_REMAP_VIEW_PROPERTY(src, imageURL)
RCT_REMAP_VIEW_PROPERTY(resizeMode, contentMode)

@end

