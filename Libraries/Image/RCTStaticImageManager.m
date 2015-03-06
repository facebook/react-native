// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTStaticImageManager.h"

#import <UIKit/UIKit.h>

#import "RCTConvert.h"
#import "RCTGIFImage.h"
#import "RCTStaticImage.h"

@implementation RCTStaticImageManager

- (UIView *)view
{
  return [[RCTStaticImage alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(capInsets)
RCT_REMAP_VIEW_PROPERTY(resizeMode, contentMode)
RCT_CUSTOM_VIEW_PROPERTY(src, RCTStaticImage *)
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
RCT_CUSTOM_VIEW_PROPERTY(tintColor, RCTStaticImage *)
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
