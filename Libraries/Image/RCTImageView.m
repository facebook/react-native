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
#import "RCTImageLoader.h"
#import "RCTImageUtils.h"
#import "RCTUtils.h"

#import "UIView+React.h"

/**
 * Determines whether an image of `currentSize` should be reloaded for display
 * at `idealSize`.
 */
static BOOL RCTShouldReloadImageForSizeChange(CGSize currentSize, CGSize idealSize)
{
  static const CGFloat upscaleThreshold = 1.2;
  static const CGFloat downscaleThreshold = 0.5;

  CGFloat widthMultiplier = idealSize.width / currentSize.width;
  CGFloat heightMultiplier = idealSize.height / currentSize.height;

  return widthMultiplier > upscaleThreshold || widthMultiplier < downscaleThreshold ||
    heightMultiplier > upscaleThreshold || heightMultiplier < downscaleThreshold;
}

@interface RCTImageView ()

@property (nonatomic, copy) RCTDirectEventBlock onLoadStart;
@property (nonatomic, copy) RCTDirectEventBlock onProgress;
@property (nonatomic, copy) RCTDirectEventBlock onError;
@property (nonatomic, copy) RCTDirectEventBlock onLoad;
@property (nonatomic, copy) RCTDirectEventBlock onLoadEnd;

@end

@implementation RCTImageView
{
  RCTBridge *_bridge;
  CGSize _targetSize;

  /**
   * A block that can be invoked to cancel the most recent call to -reloadImage,
   * if any.
   */
  RCTImageLoaderCancellationBlock _reloadImageCancellationBlock;
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

+ (BOOL)srcNeedsReload:(NSString *)src
{
  return
    [src hasPrefix:@"http://"] ||
    [src hasPrefix:@"https://"] ||
    [src hasPrefix:@"assets-library://"] ||
    [src hasPrefix:@"ph://"];
}

- (void)setContentMode:(UIViewContentMode)contentMode
{
  if (self.contentMode != contentMode) {
    super.contentMode = contentMode;
    if ([RCTImageView srcNeedsReload:_src]) {
      [self reloadImage];
    }
  }
}

- (void)cancelImageLoad
{
  RCTImageLoaderCancellationBlock previousCancellationBlock = _reloadImageCancellationBlock;
  if (previousCancellationBlock) {
    previousCancellationBlock();
    _reloadImageCancellationBlock = nil;
  }
}

- (void)clearImage
{
  [self cancelImageLoad];
  [self.layer removeAnimationForKey:@"contents"];
  self.image = nil;
}

- (void)reloadImage
{
  [self cancelImageLoad];

  if (_src && self.frame.size.width > 0 && self.frame.size.height > 0) {
    if (_onLoadStart) {
      _onLoadStart(nil);
    }

    RCTImageLoaderProgressBlock progressHandler = nil;
    if (_onProgress) {
      progressHandler = ^(int64_t loaded, int64_t total) {
        _onProgress(@{
          @"loaded": @((double)loaded),
          @"total": @((double)total),
        });
      };
    }

    _reloadImageCancellationBlock = [_bridge.imageLoader loadImageWithTag:_src
                                                                     size:self.bounds.size
                                                                    scale:RCTScreenScale()
                                                               resizeMode:self.contentMode
                                                            progressBlock:progressHandler
                                                          completionBlock:^(NSError *error, UIImage *image) {
      if (image.reactKeyframeAnimation) {
        [self.layer addAnimation:image.reactKeyframeAnimation forKey:@"contents"];
      } else {
        [self.layer removeAnimationForKey:@"contents"];
        self.image = image;
      }
      if (error) {
        if (_onError) {
          _onError(@{ @"error": error.localizedDescription });
        }
      } else {
        if (_onLoad) {
          _onLoad(nil);
        }
      }
      if (_onLoadEnd) {
         _onLoadEnd(nil);
      }
    }];
  } else {
    [self clearImage];
  }
}

- (void)reactSetFrame:(CGRect)frame
{
  [super reactSetFrame:frame];
  if (self.image == nil) {
    _targetSize = frame.size;
    [self reloadImage];
  } else if ([RCTImageView srcNeedsReload:_src]) {
    CGSize imageSize = self.image.size;
    CGSize idealSize = RCTTargetSize(imageSize, self.image.scale, frame.size, RCTScreenScale(), self.contentMode, YES);

    if (RCTShouldReloadImageForSizeChange(imageSize, idealSize)) {
      if (RCTShouldReloadImageForSizeChange(_targetSize, idealSize)) {
        RCTLogInfo(@"[PERF IMAGEVIEW] Reloading image %@ as size %@", _src, NSStringFromCGSize(idealSize));

        // If the existing image or an image being loaded are not the right size, reload the asset in case there is a
        // better size available.
        _targetSize = idealSize;
        [self reloadImage];
      }
    } else {
      // Our existing image is good enough.
      [self cancelImageLoad];
      _targetSize = imageSize;
    }
  }
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  if (!self.window) {
    // Don't keep self alive through the asynchronous dispatch, if the intention was to remove the view so it would
    // deallocate.
    __weak typeof(self) weakSelf = self;

    dispatch_async(dispatch_get_main_queue(), ^{
      __strong typeof(self) strongSelf = weakSelf;
      if (!strongSelf) {
        return;
      }

      // If we haven't been re-added to a window by this run loop iteration, clear out the image to save memory.
      if (!strongSelf.window) {
        [strongSelf clearImage];
      }
    });
  } else if (!self.image && self.src) {
    [self reloadImage];
  }
}

@end
