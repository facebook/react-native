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
#import "RCTImageSource.h"
#import "RCTImageUtils.h"
#import "RCTUtils.h"
#import "RCTImageBlurUtils.h"

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
  __weak RCTBridge *_bridge;
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

    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
    [center addObserver:self
               selector:@selector(clearImageIfDetached)
                   name:UIApplicationDidReceiveMemoryWarningNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(clearImageIfDetached)
                   name:UIApplicationDidEnterBackgroundNotification
                 object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
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

- (void)setBlurRadius:(CGFloat)blurRadius
{
  if (blurRadius != _blurRadius) {
    _blurRadius = blurRadius;
    [self reloadImage];
  }
}

- (void)setCapInsets:(UIEdgeInsets)capInsets
{
  if (!UIEdgeInsetsEqualToEdgeInsets(_capInsets, capInsets)) {
    if (UIEdgeInsetsEqualToEdgeInsets(_capInsets, UIEdgeInsetsZero) ||
        UIEdgeInsetsEqualToEdgeInsets(capInsets, UIEdgeInsetsZero)) {
      _capInsets = capInsets;
      // Need to reload image when enabling or disabling capInsets
      [self reloadImage];
    } else {
      _capInsets = capInsets;
      [self updateImage];
    }
  }
}

- (void)setRenderingMode:(UIImageRenderingMode)renderingMode
{
  if (_renderingMode != renderingMode) {
    _renderingMode = renderingMode;
    [self updateImage];
  }
}

- (void)setSource:(RCTImageSource *)source
{
  if (![source isEqual:_source]) {
    _source = source;
    [self reloadImage];
  }
}

- (BOOL)sourceNeedsReload
{
  // If capInsets are set, image doesn't need reloading when resized
  return UIEdgeInsetsEqualToEdgeInsets(_capInsets, UIEdgeInsetsZero);
}

- (void)setContentMode:(UIViewContentMode)contentMode
{
  if (self.contentMode != contentMode) {
    super.contentMode = contentMode;
    if ([self sourceNeedsReload]) {
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

- (void)clearImageIfDetached
{
  if (!self.window) {
    [self clearImage];
  }
}

- (void)reloadImage
{
  [self cancelImageLoad];

  if (_source && self.frame.size.width > 0 && self.frame.size.height > 0) {
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

    CGSize imageSize = self.bounds.size;
    CGFloat imageScale = RCTScreenScale();
    if (!UIEdgeInsetsEqualToEdgeInsets(_capInsets, UIEdgeInsetsZero)) {
      // Don't resize images that use capInsets
      imageSize = CGSizeZero;
      imageScale = _source.scale;
    }

    RCTImageSource *source = _source;
    CGFloat blurRadius = _blurRadius;
    __weak RCTImageView *weakSelf = self;
    _reloadImageCancellationBlock =
    [_bridge.imageLoader loadImageWithURLRequest:_source.request
                                            size:imageSize
                                           scale:imageScale
                                         clipped:NO
                                      resizeMode:(RCTResizeMode)self.contentMode
                                   progressBlock:progressHandler
                                 completionBlock:^(NSError *error, UIImage *loadedImage) {

      RCTImageView *strongSelf = weakSelf;
      void (^setImageBlock)(UIImage *) = ^(UIImage *image) {
        if (![source isEqual:strongSelf.source]) {
          // Bail out if source has changed since we started loading
          return;
        }
        if (image.reactKeyframeAnimation) {
          [strongSelf.layer addAnimation:image.reactKeyframeAnimation forKey:@"contents"];
        } else {
          [strongSelf.layer removeAnimationForKey:@"contents"];
          strongSelf.image = image;
        }
        if (error) {
          if (strongSelf->_onError) {
            strongSelf->_onError(@{ @"error": error.localizedDescription });
          }
        } else {
          if (strongSelf->_onLoad) {
            strongSelf->_onLoad(nil);
          }
        }
        if (strongSelf->_onLoadEnd) {
          strongSelf->_onLoadEnd(nil);
        }
      };

      if (blurRadius > __FLT_EPSILON__) {
        // Blur on a background thread to avoid blocking interaction
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          UIImage *image = RCTBlurredImageWithRadius(loadedImage, blurRadius);
          RCTExecuteOnMainThread(^{
            setImageBlock(image);
          }, NO);
        });
      } else {
        // No blur, so try to set the image on the main thread synchronously to minimize image
        // flashing. (For instance, if this view gets attached to a window, then -didMoveToWindow
        // calls -reloadImage, and we want to set the image synchronously if possible so that the
        // image property is set in the same CATransaction that attaches this view to the window.)
        if ([NSThread isMainThread]) {
          setImageBlock(loadedImage);
        } else {
          RCTExecuteOnMainThread(^{
            setImageBlock(loadedImage);
          }, NO);
        }
      }
    }];
  } else {
    [self clearImage];
  }
}

- (void)reactSetFrame:(CGRect)frame
{
  [super reactSetFrame:frame];

  if (!self.image || self.image == _defaultImage) {
    _targetSize = frame.size;
    [self reloadImage];
  } else if ([self sourceNeedsReload]) {
    CGSize imageSize = self.image.size;
    CGSize idealSize = RCTTargetSize(imageSize, self.image.scale, frame.size,
                                     RCTScreenScale(), (RCTResizeMode)self.contentMode, YES);

    if (RCTShouldReloadImageForSizeChange(imageSize, idealSize)) {
      if (RCTShouldReloadImageForSizeChange(_targetSize, idealSize)) {
        RCTLogInfo(@"[PERF IMAGEVIEW] Reloading image %@ as size %@", _source.request.URL.absoluteString, NSStringFromCGSize(idealSize));

        // If the existing image or an image being loaded are not the right
        // size, reload the asset in case there is a better size available.
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

  if (self.window && (!self.image || self.image == _defaultImage)) {
    [self reloadImage];
  }
}

@end
