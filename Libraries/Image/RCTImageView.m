/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTImageView.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTGIFImage.h"
#import "RCTImageLoader.h"
#import "RCTImageUtils.h"
#import "RCTUtils.h"

#import "UIView+React.h"

@interface RCTImageView ()

@property (nonatomic, assign) BOOL onLoadStart;
@property (nonatomic, assign) BOOL onProgress;
@property (nonatomic, assign) BOOL onError;
@property (nonatomic, assign) BOOL onLoad;
@property (nonatomic, assign) BOOL onLoadEnd;

@end

@implementation RCTImageView
{
  RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if ((self = [super init])) {
    _bridge = bridge;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)updateImage
{
  UIImage *image = self.image;
  if (!image) {
    return;
  }

  // Apply rendering mode
  if (_renderingMode != image.renderingMode) {
    image = [image imageWithRenderingMode:_renderingMode];
  }

  // Applying capInsets of 0 will switch the "resizingMode" of the image to "tile" which is undesired
  if (!UIEdgeInsetsEqualToEdgeInsets(UIEdgeInsetsZero, _capInsets)) {
    image = [image resizableImageWithCapInsets:_capInsets resizingMode:UIImageResizingModeStretch];
  }

  // Apply trilinear filtering to smooth out mis-sized images
  self.layer.minificationFilter = kCAFilterTrilinear;
  self.layer.magnificationFilter = kCAFilterTrilinear;

  super.image = image;
}

- (void)setImage:(UIImage *)image
{
  image = image ?: _defaultImage;
  if (image != super.image) {
    super.image = image;
    [self updateImage];
  }
}

- (void)setCapInsets:(UIEdgeInsets)capInsets
{
  if (!UIEdgeInsetsEqualToEdgeInsets(_capInsets, capInsets)) {
    _capInsets = capInsets;
    [self updateImage];
  }
}

- (void)setRenderingMode:(UIImageRenderingMode)renderingMode
{
  if (_renderingMode != renderingMode) {
    _renderingMode = renderingMode;
    [self updateImage];
  }
}

- (void)setSrc:(NSString *)src
{
  if (![src isEqual:_src]) {
    _src = [src copy];
    [self reloadImage];
  }
}

- (void)setContentMode:(UIViewContentMode)contentMode
{
  if (self.contentMode != contentMode) {
    super.contentMode = contentMode;
    if ([RCTImageLoader isAssetLibraryImage:_src] || [RCTImageLoader isRemoteImage:_src]) {
      [self reloadImage];
    }
  }
}

- (void)reloadImage
{
  if (_src && !CGSizeEqualToSize(self.frame.size, CGSizeZero)) {

    if (_onLoadStart) {
      NSDictionary *event = @{ @"target": self.reactTag };
      [_bridge.eventDispatcher sendInputEventWithName:@"loadStart" body:event];
    }

    RCTImageLoaderProgressBlock progressHandler = nil;
    if (_onProgress) {
      progressHandler = ^(int64_t loaded, int64_t total) {
        NSDictionary *event = @{
          @"target": self.reactTag,
          @"loaded": @((double)loaded),
          @"total": @((double)total),
        };
        [_bridge.eventDispatcher sendInputEventWithName:@"progress" body:event];
      };
    }

    [_bridge.imageLoader loadImageWithTag:_src
                                     size:self.bounds.size
                                    scale:RCTScreenScale()
                               resizeMode:self.contentMode
                            progressBlock:progressHandler
                          completionBlock:^(NSError *error, id image) {

      if ([image isKindOfClass:[CAAnimation class]]) {
        [self.layer addAnimation:image forKey:@"contents"];
      } else {
        [self.layer removeAnimationForKey:@"contents"];
        self.image = image;
      }
      if (error) {
        if (_onError) {
          NSDictionary *event = @{
            @"target": self.reactTag,
            @"error": error.localizedDescription,
          };
          [_bridge.eventDispatcher sendInputEventWithName:@"error" body:event];
        }
      } else {
        if (_onLoad) {
          NSDictionary *event = @{ @"target": self.reactTag };
          [_bridge.eventDispatcher sendInputEventWithName:@"load" body:event];
        }
      }
      if (_onLoadEnd) {
        NSDictionary *event = @{ @"target": self.reactTag };
        [_bridge.eventDispatcher sendInputEventWithName:@"loadEnd" body:event];
      }
    }];
  } else {
    [self.layer removeAnimationForKey:@"contents"];
    self.image = nil;
  }
}

- (void)reactSetFrame:(CGRect)frame
{
  [super reactSetFrame:frame];
  if (self.image == nil) {
    [self reloadImage];
  } else if ([RCTImageLoader isAssetLibraryImage:_src] || [RCTImageLoader isRemoteImage:_src]) {

    // Get optimal image size
    CGSize currentSize = self.image.size;
    CGSize idealSize = RCTTargetSize(self.image.size, self.image.scale, frame.size,
                                     RCTScreenScale(), self.contentMode, YES);

    CGFloat widthChangeFraction = ABS(currentSize.width - idealSize.width) / currentSize.width;
    CGFloat heightChangeFraction = ABS(currentSize.height - idealSize.height) / currentSize.height;

    // If the combined change is more than 20%, reload the asset in case there is a better size.
    if (widthChangeFraction + heightChangeFraction > 0.2) {
      [self reloadImage];
    }
  }
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  if (!self.window) {
    [self.layer removeAnimationForKey:@"contents"];
    self.image = nil;
  } else if (self.src) {
    [self reloadImage];
  }
}

@end
