/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTImageViewManager.h"

#import <UIKit/UIKit.h>

#import "RCTConvert.h"
#import "RCTImageView.h"

@implementation RCTImageViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTImageView alloc] initWithBridge:self.bridge];
}

RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
RCT_REMAP_VIEW_PROPERTY(defaultImageSrc, defaultImage, UIImage)
RCT_REMAP_VIEW_PROPERTY(resizeMode, contentMode, UIViewContentMode)
RCT_EXPORT_VIEW_PROPERTY(src, NSString)
RCT_EXPORT_VIEW_PROPERTY(onLoadStart, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onProgress, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onError, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onLoad, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, BOOL)
RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, RCTImageView)
{
  if (json) {
    view.renderingMode = UIImageRenderingModeAlwaysTemplate;
    view.tintColor = [RCTConvert UIColor:json];
  } else {
    view.renderingMode = defaultView.renderingMode;
    view.tintColor = defaultView.tintColor;
  }
}

- (NSArray *)customDirectEventTypes
{
  return @[
    @"loadStart",
    @"progress",
    @"error",
    @"load",
    @"loadEnd",
  ];
}

@end
