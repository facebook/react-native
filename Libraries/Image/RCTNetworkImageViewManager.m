/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTNetworkImageViewManager.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTImageDownloader.h"
#import "RCTNetworkImageView.h"
#import "RCTUtils.h"

@implementation RCTNetworkImageViewManager

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;

- (UIView *)view
{
  return [[RCTNetworkImageView alloc] initWithEventDispatcher:self.bridge.eventDispatcher imageDownloader:[RCTImageDownloader sharedInstance]];
}

RCT_REMAP_VIEW_PROPERTY(defaultImageSrc, defaultImage, UIImage)
RCT_REMAP_VIEW_PROPERTY(src, imageURL, NSURL)
RCT_REMAP_VIEW_PROPERTY(resizeMode, contentMode, UIViewContentMode)
RCT_EXPORT_VIEW_PROPERTY(progressHandlerRegistered, BOOL)

- (NSDictionary *)customDirectEventTypes
{
  return @{
    @"loadStart":    @{ @"registrationName": @"onLoadStart" },
    @"loadProgress": @{ @"registrationName": @"onLoadProgress" },
    @"loaded":       @{ @"registrationName": @"onLoaded" },
    @"loadError":    @{ @"registrationName": @"onLoadError" },
    @"loadAbort":    @{ @"registrationName": @"onLoadAbort" },
  };
}

@end
