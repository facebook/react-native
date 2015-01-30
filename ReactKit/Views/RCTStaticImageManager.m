// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTStaticImageManager.h"

#import <UIKit/UIKit.h>

#import "RCTStaticImage.h"
#import "RCTConvert.h"

@implementation RCTStaticImageManager

- (UIView *)viewWithEventDispatcher:(RCTJavaScriptEventDispatcher *)eventDispatcher
{
  return [[RCTStaticImage alloc] init];
}

RCT_REMAP_VIEW_PROPERTY(src, image)
RCT_REMAP_VIEW_PROPERTY(resizeMode, contentMode)

- (void)set_capInsets:(id)json forView:(RCTStaticImage *)view withDefaultView:(RCTStaticImage *)defaultView
{
  view.capInsets = json ? [RCTConvert UIEdgeInsets:json] : defaultView.capInsets;
}

- (void)set_tintColor:(id)json forView:(RCTStaticImage *)view withDefaultView:(RCTStaticImage *)defaultView
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

