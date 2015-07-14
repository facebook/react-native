/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTStaticImageManager.h"

#import <UIKit/UIKit.h>

#import "RCTConvert.h"
#import "RCTStaticImage.h"

@implementation RCTStaticImageManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTStaticImage alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
RCT_REMAP_VIEW_PROPERTY(imageTag, src, NSString)
RCT_REMAP_VIEW_PROPERTY(resizeMode, contentMode, UIViewContentMode)
RCT_EXPORT_VIEW_PROPERTY(src, NSString)
RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, RCTStaticImage)
{
  if (json) {
    view.renderingMode = UIImageRenderingModeAlwaysTemplate;
    view.tintColor = [RCTConvert UIColor:json];
  } else {
    view.renderingMode = defaultView.renderingMode;
    view.tintColor = defaultView.tintColor;
  }
}

@end
