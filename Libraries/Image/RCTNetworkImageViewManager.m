/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTNetworkImageViewManager.h"

#import "RCTNetworkImageView.h"

#import "RCTConvert.h"
#import "RCTUtils.h"

#import "RCTImageDownloader.h"

@implementation RCTNetworkImageViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  RCTNetworkImageView *view = [[RCTNetworkImageView alloc] initWithFrame:CGRectZero imageDownloader:[RCTImageDownloader sharedInstance]];
  view.contentMode = UIViewContentModeScaleAspectFill;
  return view;
}

RCT_REMAP_VIEW_PROPERTY(defaultImageSrc, defaultImage, UIImage)
RCT_REMAP_VIEW_PROPERTY(src, imageURL, NSURL)
RCT_EXPORT_VIEW_PROPERTY(contentMode, UIViewContentMode)

@end
