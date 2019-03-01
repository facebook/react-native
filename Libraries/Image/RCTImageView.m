/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTImageView.h"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTImageSource.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>

#import "RCTImageBlurUtils.h"
#import "RCTImageLoader.h"
#import "RCTImageUtils.h"

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

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
/**
 * Implements macOS equivalent behavior of UIViewContentModeScaleAspectFill.
 * Used for RCTResizeModeCover support.
 */
static NSImage *RCTFillImagePreservingAspectRatio(NSImage *originalImage, NSSize targetSize, CGFloat windowScale)
{
  RCTAssertParam(originalImage);
  if (!originalImage) {
    return nil;
  }

  NSSize originalImageSize = originalImage.size;
  if (NSEqualSizes(originalImageSize, NSZeroSize) || [[originalImage representations] count] == 0) {
    return originalImage;
  }

  CGFloat scaleX = targetSize.width / originalImageSize.width;
  CGFloat scaleY = targetSize.height / originalImageSize.height;
  CGFloat scale = 1.0;

  if (scaleX < scaleY) {
    // clamped width
    scale = scaleY;
  }
  else {
    // clamped height
    scale = scaleX;
  }

  NSSize newSize = NSMakeSize(RCTRoundPixelValue(originalImageSize.width * scale, windowScale),
                              RCTRoundPixelValue(originalImageSize.height * scale, windowScale));
  NSImage *newImage = [[NSImage alloc] initWithSize:newSize];

  for (NSImageRep *imageRep in [originalImage representations]) {
    NSImageRep *newImageRep = [imageRep copy];
    NSSize newImageRepSize = NSMakeSize(RCTRoundPixelValue(imageRep.size.width * scale, windowScale),
                                        RCTRoundPixelValue(imageRep.size.height * scale, windowScale));

    newImageRep.size = newImageRepSize;

    [newImage addRepresentation:newImageRep];
  }

  return newImage;
}
#endif // ]TODO(macOS ISS#2323203)

/**
 * See RCTConvert (ImageSource). We want to send down the source as a similar
 * JSON parameter.
 */
static NSDictionary *onLoadParamsForSource(RCTImageSource *source)
{
  NSDictionary *dict = @{
    @"width": @(source.size.width),
    @"height": @(source.size.height),
    @"url": source.request.URL.absoluteString,
  };
  return @{ @"source": dict };
}

@interface RCTImageView ()

@property (nonatomic, copy) RCTDirectEventBlock onLoadStart;
@property (nonatomic, copy) RCTDirectEventBlock onProgress;
@property (nonatomic, copy) RCTDirectEventBlock onError;
@property (nonatomic, copy) RCTDirectEventBlock onPartialLoad;
@property (nonatomic, copy) RCTDirectEventBlock onLoad;
@property (nonatomic, copy) RCTDirectEventBlock onLoadEnd;

@end

@implementation RCTImageView
{
  // Weak reference back to the bridge, for image loading
  __weak RCTBridge *_bridge;

  // The image source that's currently displayed
  RCTImageSource *_imageSource;

  // The image source that's being loaded from the network
  RCTImageSource *_pendingImageSource;

  // Size of the image loaded / being loaded, so we can determine when to issue a reload to accommodate a changing size.
  CGSize _targetSize;

  // A block that can be invoked to cancel the most recent call to -reloadImage, if any
  RCTImageLoaderCancellationBlock _reloadImageCancellationBlock;

  // Whether the latest change of props requires the image to be reloaded
  BOOL _needsReload;
  
#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
  // Whether observing changes to the window's backing scale
  BOOL _subscribedToWindowBackingNotifications;
#endif // ]TODO(macOS ISS#2323203)
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if ((self = [super init])) {
#else // [TODO(macOS ISS#2323203)
  if ((self = [super initWithFrame:NSZeroRect])) {
#endif // ]TODO(macOS ISS#2323203)
    _bridge = bridge;
#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
    self.wantsLayer = YES;
#endif

#if !TARGET_OS_OSX // ]TODO(macOS ISS#2323203)
    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
    [center addObserver:self
               selector:@selector(clearImageIfDetached)
                   name:UIApplicationDidReceiveMemoryWarningNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(clearImageIfDetached)
                   name:UIApplicationDidEnterBackgroundNotification
                 object:nil];
#endif // TODO(macOS ISS#2323203)
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(NSRect)frame)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)coder)
#endif // ]TODO(macOS ISS#2323203)

- (void)updateWithImage:(UIImage *)image
{
  if (!image) {
    super.image = nil;
    return;
  }

  // Apply rendering mode
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if (_renderingMode != image.renderingMode) {
    image = [image imageWithRenderingMode:_renderingMode];
  }
#else // [TODO(macOS ISS#2323203)
  if ((_renderingMode == UIImageRenderingModeAlwaysTemplate) != image.template) {
    image.template = (_renderingMode == UIImageRenderingModeAlwaysTemplate);
  }
#endif // ]TODO(macOS ISS#2323203)

  if (_resizeMode == RCTResizeModeRepeat) {
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
    image = [image resizableImageWithCapInsets:_capInsets resizingMode:UIImageResizingModeTile];
#else // [TODO(macOS ISS#2323203)
    image.capInsets = _capInsets;
    image.resizingMode = NSImageResizingModeTile;
#endif // ]TODO(macOS ISS#2323203)
  } else if (!UIEdgeInsetsEqualToEdgeInsets(UIEdgeInsetsZero, _capInsets)) {
    // Applying capInsets of 0 will switch the "resizingMode" of the image to "tile" which is undesired
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
    image = [image resizableImageWithCapInsets:_capInsets resizingMode:UIImageResizingModeStretch];
#else // [TODO(macOS ISS#2323203)
    image.capInsets = _capInsets;
    image.resizingMode = NSImageResizingModeStretch;
#endif // ]TODO(macOS ISS#2323203)
  }

  // Apply trilinear filtering to smooth out mis-sized images
  self.layer.minificationFilter = kCAFilterTrilinear;
  self.layer.magnificationFilter = kCAFilterTrilinear;

  super.image = image;
}

- (void)setImage:(UIImage *)image
{
  image = image ?: _defaultImage;
  if (image != self.image) {
#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
    if (image && _resizeMode == RCTResizeModeCover && !NSEqualSizes(self.bounds.size, NSZeroSize)) {
      image = RCTFillImagePreservingAspectRatio(image, self.bounds.size, self.window.backingScaleFactor ?: 1.0);
    }
#endif // ]TODO(macOS ISS#2323203)
    [self updateWithImage:image];
  }
}

- (void)setBlurRadius:(CGFloat)blurRadius
{
  if (blurRadius != _blurRadius) {
    _blurRadius = blurRadius;
    _needsReload = YES;
  }
}

- (void)setCapInsets:(UIEdgeInsets)capInsets
{
  if (!UIEdgeInsetsEqualToEdgeInsets(_capInsets, capInsets)) {
    if (UIEdgeInsetsEqualToEdgeInsets(_capInsets, UIEdgeInsetsZero) ||
        UIEdgeInsetsEqualToEdgeInsets(capInsets, UIEdgeInsetsZero)) {
      _capInsets = capInsets;
      // Need to reload image when enabling or disabling capInsets
      _needsReload = YES;
    } else {
      _capInsets = capInsets;
      [self updateWithImage:self.image];
    }
  }
}

- (void)setRenderingMode:(UIImageRenderingMode)renderingMode
{
  if (_renderingMode != renderingMode) {
    _renderingMode = renderingMode;
    [self updateWithImage:self.image];
  }
}

- (void)setImageSources:(NSArray<RCTImageSource *> *)imageSources
{
  if (![imageSources isEqual:_imageSources]) {
    _imageSources = [imageSources copy];
    _needsReload = YES;
  }
}

- (void)setResizeMode:(RCTResizeMode)resizeMode
{
  if (_resizeMode != resizeMode) {
    _resizeMode = resizeMode;

    if (_resizeMode == RCTResizeModeRepeat) {
      // Repeat resize mode is handled by the UIImage. Use scale to fill
      // so the repeated image fills the UIImageView.
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
      self.contentMode = UIViewContentModeScaleToFill;
#else // [TODO(macOS ISS#2323203)
      self.imageScaling = NSImageScaleAxesIndependently;
#endif // ]TODO(macOS ISS#2323203)
    } else {
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
      self.contentMode = (UIViewContentMode)resizeMode;
#else // [TODO(macOS ISS#2323203)
      // This relies on having previously resampled the image to a size that exceeds the iamge view.
      if (resizeMode == RCTResizeModeCover) {
        resizeMode = RCTResizeModeCenter;
      }
      self.imageScaling = (NSImageScaling)resizeMode;
#endif // ]TODO(macOS ISS#2323203)
    }

    if ([self shouldReloadImageSourceAfterResize]) {
      _needsReload = YES;
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

  _pendingImageSource = nil;
}

- (void)clearImage
{
  [self cancelImageLoad];
  [self.layer removeAnimationForKey:@"contents"];
  self.image = nil;
  _imageSource = nil;
}

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
- (void)clearImageIfDetached
{
  if (!self.window) {
    [self clearImage];
  }
}
#endif // TODO(macOS ISS#2323203)

- (BOOL)hasMultipleSources
{
  return _imageSources.count > 1;
}

- (RCTImageSource *)imageSourceForSize:(CGSize)size
{
  if (![self hasMultipleSources]) {
    return _imageSources.firstObject;
  }

  // Need to wait for layout pass before deciding.
  if (CGSizeEqualToSize(size, CGSizeZero)) {
    return nil;
  }

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  const CGFloat scale = RCTScreenScale();
#else // [TODO(macOS ISS#2323203)
  const CGFloat scale = self.window != nil ? self.window.backingScaleFactor : [NSScreen mainScreen].backingScaleFactor;
#endif // ]TODO(macOS ISS#2323203)
  const CGFloat targetImagePixels = size.width * size.height * scale * scale;

  RCTImageSource *bestSource = nil;
  CGFloat bestFit = CGFLOAT_MAX;
  for (RCTImageSource *source in _imageSources) {
    CGSize imgSize = source.size;
    const CGFloat imagePixels =
      imgSize.width * imgSize.height * source.scale * source.scale;
    const CGFloat fit = ABS(1 - (imagePixels / targetImagePixels));

    if (fit < bestFit) {
      bestFit = fit;
      bestSource = source;
    }
  }
  return bestSource;
}

- (BOOL)shouldReloadImageSourceAfterResize
{
  // If capInsets are set, image doesn't need reloading when resized
  return UIEdgeInsetsEqualToEdgeInsets(_capInsets, UIEdgeInsetsZero);
}

- (BOOL)shouldChangeImageSource
{
  // We need to reload if the desired image source is different from the current image
  // source AND the image load that's pending
  RCTImageSource *desiredImageSource = [self imageSourceForSize:self.frame.size];
  return ![desiredImageSource isEqual:_imageSource] &&
         ![desiredImageSource isEqual:_pendingImageSource];
}

- (void)reloadImage
{
  [self cancelImageLoad];
  _needsReload = NO;

  RCTImageSource *source = [self imageSourceForSize:self.frame.size];
  _pendingImageSource = source;

  if (source && self.frame.size.width > 0 && self.frame.size.height > 0) {
    if (_onLoadStart) {
      _onLoadStart(nil);
    }

    RCTImageLoaderProgressBlock progressHandler = nil;
    if (_onProgress) {
      progressHandler = ^(int64_t loaded, int64_t total) {
        self->_onProgress(@{
          @"loaded": @((double)loaded),
          @"total": @((double)total),
        });
      };
    }

    __weak RCTImageView *weakSelf = self;
    RCTImageLoaderPartialLoadBlock partialLoadHandler = ^(UIImage *image) {
      [weakSelf imageLoaderLoadedImage:image error:nil forImageSource:source partial:YES];
    };

    CGSize imageSize = self.bounds.size;
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
    CGFloat imageScale = RCTScreenScale();
#else // [TODO(macOS ISS#2323203)
    CGFloat imageScale = self.window != nil ? self.window.backingScaleFactor : [NSScreen mainScreen].backingScaleFactor;
#endif // ]TODO(macOS ISS#2323203)
    if (!UIEdgeInsetsEqualToEdgeInsets(_capInsets, UIEdgeInsetsZero)) {
      // Don't resize images that use capInsets
      imageSize = CGSizeZero;
      imageScale = source.scale;
    }

    RCTImageLoaderCompletionBlock completionHandler = ^(NSError *error, UIImage *loadedImage) {
      [weakSelf imageLoaderLoadedImage:loadedImage error:error forImageSource:source partial:NO];
    };

    _reloadImageCancellationBlock =
    [_bridge.imageLoader loadImageWithURLRequest:source.request
                                            size:imageSize
                                           scale:imageScale
                                         clipped:NO
                                      resizeMode:_resizeMode
                                   progressBlock:progressHandler
                                partialLoadBlock:partialLoadHandler
                                 completionBlock:completionHandler];
  } else {
    [self clearImage];
  }
}

- (void)imageLoaderLoadedImage:(UIImage *)loadedImage error:(NSError *)error forImageSource:(RCTImageSource *)source partial:(BOOL)isPartialLoad
{
  if (![source isEqual:_pendingImageSource]) {
    // Bail out if source has changed since we started loading
    return;
  }

  if (error) {
    if (_onError) {
      _onError(@{ @"error": error.localizedDescription });
    }
    if (_onLoadEnd) {
      _onLoadEnd(nil);
    }
    return;
  }

  void (^setImageBlock)(UIImage *) = ^(UIImage *image) {
    if (!isPartialLoad) {
      self->_imageSource = source;
      self->_pendingImageSource = nil;
    }

    if (image.reactKeyframeAnimation) {
      [self.layer addAnimation:image.reactKeyframeAnimation forKey:@"contents"];
    } else {
      [self.layer removeAnimationForKey:@"contents"];
      self.image = image;
    }

    if (isPartialLoad) {
      if (self->_onPartialLoad) {
        self->_onPartialLoad(nil);
      }
    } else {
      if (self->_onLoad) {
        RCTImageSource *sourceLoaded = [source imageSourceWithSize:image.size scale:source.scale];
        self->_onLoad(onLoadParamsForSource(sourceLoaded));
      }
      if (self->_onLoadEnd) {
        self->_onLoadEnd(nil);
      }
    }
  };

  if (_blurRadius > __FLT_EPSILON__) {
    // Blur on a background thread to avoid blocking interaction
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      UIImage *blurredImage = RCTBlurredImageWithRadius(loadedImage, self->_blurRadius);
      RCTExecuteOnMainQueue(^{
        setImageBlock(blurredImage);
      });
    });
  } else {
    // No blur, so try to set the image on the main thread synchronously to minimize image
    // flashing. (For instance, if this view gets attached to a window, then -didMoveToWindow
    // calls -reloadImage, and we want to set the image synchronously if possible so that the
    // image property is set in the same CATransaction that attaches this view to the window.)
    RCTExecuteOnMainQueue(^{
      setImageBlock(loadedImage);
    });
  }
}

- (void)reactSetFrame:(CGRect)frame
{
  [super reactSetFrame:frame];

  // If we didn't load an image yet, or the new frame triggers a different image source
  // to be loaded, reload to swap to the proper image source.
  if ([self shouldChangeImageSource]) {
    _targetSize = frame.size;
    [self reloadImage];
  } else if ([self shouldReloadImageSourceAfterResize]) {
    CGSize imageSize = self.image.size;
    CGFloat imageScale = UIImageGetScale(self.image); // [TODO(macOS ISS#2323203)
#if !TARGET_OS_OSX
    CGFloat windowScale = RCTScreenScale();
    RCTResizeMode resizeMode = (RCTResizeMode)self.contentMode;
#else
    CGFloat windowScale = self.window != nil ? self.window.backingScaleFactor : [NSScreen mainScreen].backingScaleFactor;
    RCTResizeMode resizeMode = self.resizeMode;

    // self.contentMode on iOS is translated to RCTResizeModeRepeat in -setResizeMode:
    if (resizeMode == RCTResizeModeRepeat) {
      resizeMode = RCTResizeModeStretch;
    }
#endif
    CGSize idealSize = RCTTargetSize(imageSize, imageScale, frame.size, windowScale,
                                     resizeMode, YES); // ]TODO(macOS ISS#2323203)
    // Don't reload if the current image or target image size is close enough
    if ((!RCTShouldReloadImageForSizeChange(imageSize, idealSize) ||
         !RCTShouldReloadImageForSizeChange(_targetSize, idealSize)) // [TODO(macOS ISS#2323203)
#if TARGET_OS_OSX
         // Since mac doen't suport UIViewContentModeScaleAspectFill, we have to manually resample the image
         // If we're in cover mode we need to ensure that the image is re-sampled to the correct size when the container size (shrinking 
         // being the most obvious case) otherwise we will end up in a state an image will not properly scale inside its container
         && (resizeMode != RCTResizeModeCover || (imageSize.width == idealSize.width && imageSize.height == idealSize.height))
#endif
         ) { // ]TODO(macOS ISS#2323203)
      return;
    }

    // Don't reload if the current image size is the maximum size of the image source
    CGSize imageSourceSize = _imageSource.size;
    if (imageSize.width * imageScale == imageSourceSize.width * _imageSource.scale &&
        imageSize.height * imageScale == imageSourceSize.height * _imageSource.scale) {
      return;
    }

    RCTLogInfo(@"Reloading image %@ as size %@", _imageSource.request.URL.absoluteString, NSStringFromCGSize(idealSize));

    // If the existing image or an image being loaded are not the right
    // size, reload the asset in case there is a better size available.
    _targetSize = idealSize;
    [self reloadImage];
  }
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  if (_needsReload) {
    [self reloadImage];
  }
}

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
#define didMoveToWindow viewDidMoveToWindow
#endif
#if TARGET_OS_OSX
- (void)viewWillMoveToWindow:(NSWindow *)newWindow
{
  if (_subscribedToWindowBackingNotifications &&
      self.window != nil &&
      self.window != newWindow) {
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:NSWindowDidChangeBackingPropertiesNotification
                                                  object:self.window];
    _subscribedToWindowBackingNotifications = NO;
  }
}
#endif // ]TODO(macOS ISS#2323203)
- (void)didMoveToWindow
{
  [super didMoveToWindow];

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
  if (!_subscribedToWindowBackingNotifications && self.window != nil) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(windowDidChangeBackingProperties:)
                                                 name:NSWindowDidChangeBackingPropertiesNotification
                                               object:self.window];
    _subscribedToWindowBackingNotifications = YES;
  }
#endif // ]TODO(macOS ISS#2323203)
  if (!self.window) {
    // Cancel loading the image if we've moved offscreen. In addition to helping
    // prioritise image requests that are actually on-screen, this removes
    // requests that have gotten "stuck" from the queue, unblocking other images
    // from loading.
    [self cancelImageLoad];
  } else if ([self shouldChangeImageSource]) {
    [self reloadImage];
  }
}

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
- (void)windowDidChangeBackingProperties:(NSNotification *)notification
{
  [self reloadImage];
}
#endif // ]TODO(macOS ISS#2323203)
@end
