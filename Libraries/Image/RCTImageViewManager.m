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

#import <React/RCTConvert.h>
#import <React/RCTImageSource.h>

#import "RCTImageLoader.h"
#import "RCTImageView.h"

@implementation RCTImageViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTImageView alloc] initWithBridge:self.bridge];
}

RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(capInsets, UIEdgeInsets)
RCT_REMAP_VIEW_PROPERTY(defaultSource, defaultImage, UIImage)
RCT_EXPORT_VIEW_PROPERTY(onLoadStart, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onProgress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPartialLoad, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLoad, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLoadEnd, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(resizeMode, RCTResizeMode)
RCT_REMAP_VIEW_PROPERTY(source, imageSources, NSArray<RCTImageSource *>);
RCT_CUSTOM_VIEW_PROPERTY(tintColor, UIColor, RCTImageView)
{
  // Default tintColor isn't nil - it's inherited from the superView - but we
  // want to treat a null json value for `tintColor` as meaning 'disable tint',
  // so we toggle `renderingMode` here instead of in `-[RCTImageView setTintColor:]`
  view.tintColor = [RCTConvert UIColor:json] ?: defaultView.tintColor;
  view.renderingMode = json ? UIImageRenderingModeAlwaysTemplate : defaultView.renderingMode;
}

RCT_EXPORT_METHOD(getSize:(NSURLRequest *)request
                  successBlock:(RCTResponseSenderBlock)successBlock
                  errorBlock:(RCTResponseErrorBlock)errorBlock)
{
  [self.bridge.imageLoader getImageSizeForURLRequest:request
                                               block:^(NSError *error, CGSize size) {
                                                 if (error) {
                                                   errorBlock(error);
                                                 } else {
                                                   successBlock(@[@(size.width), @(size.height)]);
                                                 }
                                               }];
}

RCT_EXPORT_METHOD(prefetchImage:(NSURLRequest *)request
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  if (!request) {
    reject(@"E_INVALID_URI", @"Cannot prefetch an image for an empty URI", nil);
    return;
  }

  [self.bridge.imageLoader loadImageWithURLRequest:request
                                          callback:^(NSError *error, UIImage *image) {
                                            if (error) {
                                              reject(@"E_PREFETCH_FAILURE", nil, error);
                                              return;
                                            }
                                            resolve(@YES);
                                          }];
}

#define RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, RCTImageView)      \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, RCTImageView)    \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

RCT_VIEW_BORDER_PROPERTY(Top)
RCT_VIEW_BORDER_PROPERTY(Right)
RCT_VIEW_BORDER_PROPERTY(Bottom)
RCT_VIEW_BORDER_PROPERTY(Left)

#define RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, RCTImageView)   \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)

RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

@end
