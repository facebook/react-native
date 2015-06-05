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

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTStaticImage alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
RCT_REMAP_VIEW_PROPERTY(resizeMode, contentMode, UIViewContentMode)
RCT_CUSTOM_VIEW_PROPERTY(src, NSURL, RCTStaticImage)
{
  if (json) {
    if ([[[json description] pathExtension] caseInsensitiveCompare:@"gif"] == NSOrderedSame) {
      [view.layer addAnimation:RCTGIFImageWithFileURL([RCTConvert NSURL:json]) forKey:@"contents"];
    } else {
      [view.layer removeAnimationForKey:@"contents"];
      view.image = [RCTConvert UIImage:json];
    }
  } else {
    [view.layer removeAnimationForKey:@"contents"];
    view.image = defaultView.image;
  }
}
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
RCT_CUSTOM_VIEW_PROPERTY(imageTag, NSString, RCTStaticImage)
{
  if (json) {
    [RCTImageLoader loadImageWithTag:[RCTConvert NSString:json] callback:^(NSError *error, id image) {
      if (error) {
        RCTLogWarn(@"%@", error.localizedDescription);
      }
      if ([image isKindOfClass:[CAAnimation class]]) {
        [view.layer addAnimation:image forKey:@"contents"];
      } else {
        [view.layer removeAnimationForKey:@"contents"];
        view.image = image;
      }
    }];
  } else {
    [view.layer removeAnimationForKey:@"contents"];
    view.image = defaultView.image;
  }
}

@end
