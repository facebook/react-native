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
#import "RCTGIFImage.h"
#import "RCTImageLoader.h"
#import "RCTStaticImage.h"

@implementation RCTStaticImageManager

- (UIView *)view
{
  return [[RCTStaticImage alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(capInsets)
RCT_REMAP_VIEW_PROPERTY(resizeMode, contentMode)
RCT_CUSTOM_VIEW_PROPERTY(src, RCTStaticImage)
{
  if (json) {
    if ([[[json description] pathExtension] caseInsensitiveCompare:@"gif"] == NSOrderedSame) {
      [view.layer addAnimation:RCTGIFImageWithFileURL([RCTConvert NSURL:json]) forKey:@"contents"];
    } else {
      view.image = [RCTConvert UIImage:json];
    }
  } else {
    view.image = defaultView.image;
  }
}
RCT_CUSTOM_VIEW_PROPERTY(tintColor, RCTStaticImage)
{
  if (json) {
    view.renderingMode = UIImageRenderingModeAlwaysTemplate;
    view.tintColor = [RCTConvert UIColor:json];
  } else {
    view.renderingMode = defaultView.renderingMode;
    view.tintColor = defaultView.tintColor;
  }
}
RCT_CUSTOM_VIEW_PROPERTY(imageTag, RCTStaticImage)
{
  if (json) {
    [RCTImageLoader loadImageWithTag:[RCTConvert NSString:json] callback:^(NSError *error, UIImage *image) {
      if (error) {
        RCTLogWarn(@"%@", error.localizedDescription);
      } else {
        view.image = image;
      }
    }];
  } else {
    view.image = defaultView.image;
  }
}

@end
