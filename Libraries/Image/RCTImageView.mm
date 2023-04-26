/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTImageView.h>

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTImageBlurUtils.h>
#import <React/RCTImageLoaderWithAttributionProtocol.h>
#import <React/RCTImageSource.h>
#import <React/RCTImageUtils.h>
#import <React/RCTUIImageViewAnimated.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>

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

#if TARGET_OS_OSX // [macOS
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
  if (NSEqualSizes(originalImageSize, NSZeroSize) ||
      NSEqualSizes(originalImageSize, targetSize) ||
      [[originalImage representations] count] == 0) {
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
#endif // macOS]

/**
 * See RCTConvert (ImageSource). We want to send down the source as a similar
 * JSON parameter.
 */
static NSDictionary *onLoadParamsForSource(RCTImageSource *source)
{
  NSDictionary *dict = @{
    @"uri" : source.request.URL.absoluteString,
    @"width" : @(source.size.width),
    @"height" : @(source.size.height),
  };
  return @{@"source" : dict};
}

@interface RCTImageView ()

@property (nonatomic, copy) RCTDirectEventBlock onLoadStart;
@property (nonatomic, copy) RCTDirectEventBlock onProgress;
@property (nonatomic, copy) RCTDirectEventBlock onError;
@property (nonatomic, copy) RCTDirectEventBlock onPartialLoad;
@property (nonatomic, copy) RCTDirectEventBlock onLoad;
@property (nonatomic, copy) RCTDirectEventBlock onLoadEnd;

@end

@implementation RCTImageView {
  // Weak reference back to the bridge, for image loading
  __weak RCTBridge *_bridge;

  // Weak reference back to the active image loader.
  __weak id<RCTImageLoaderWithAttributionProtocol> _imageLoader;

  // The image source that's currently displayed
  RCTImageSource *_imageSource;

  // The image source that's being loaded from the network
  RCTImageSource *_pendingImageSource;

  // Size of the image loaded / being loaded, so we can determine when to issue a reload to accommodate a changing size.
  CGSize _targetSize;

  // Whether the latest change of props requires the image to be reloaded
  BOOL _needsReload;

  UIImage *_image; // [macOS]

  RCTUIImageViewAnimated *_imageView;

#if TARGET_OS_OSX // [macOS
  // Whether observing changes to the window's backing scale
  BOOL _subscribedToWindowBackingNotifications;
#endif // macOS]
  
  RCTImageURLLoaderRequest *_loaderRequest;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
#if !TARGET_OS_OSX // [macOS]
  if ((self = [super initWithFrame:CGRectZero])) {
#else // [macOS
  if ((self = [super initWithFrame:NSZeroRect])) {
#endif // macOS]
    _bridge = bridge;
#if TARGET_OS_OSX // [macOS
    self.wantsLayer = YES;
#endif // macOS]
    _imageView = [RCTUIImageViewAnimated new];
    _imageView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self addSubview:_imageView];

#if !TARGET_OS_OSX // [macOS]
    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
    [center addObserver:self
               selector:@selector(clearImageIfDetached)
                   name:UIApplicationDidReceiveMemoryWarningNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(clearImageIfDetached)
                   name:UIApplicationDidEnterBackgroundNotification
                 object:nil];
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
    if (@available(iOS 13.0, *)) {
      [center addObserver:self
                 selector:@selector(clearImageIfDetached)

                     name:UISceneDidEnterBackgroundNotification
                   object:nil];
    }
#endif
#endif // [macOS]
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)init)

RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)

- (void)updateWithImage:(UIImage *)image
{
  if (!image) {
    _imageView.image = nil;
    return;
  }

  // Apply rendering mode
#if !TARGET_OS_OSX // [macOS]
  if (_renderingMode != image.renderingMode) {
    image = [image imageWithRenderingMode:_renderingMode];
  }
#endif // [macOS]

  if (_resizeMode == RCTResizeModeRepeat) {
#if !TARGET_OS_OSX // [macOS]
    image = [image resizableImageWithCapInsets:_capInsets resizingMode:UIImageResizingModeTile];
#else // [macOS
    image.capInsets = _capInsets;
    image.resizingMode = NSImageResizingModeTile;
  } else if (_resizeMode == RCTResizeModeCover) {
    if (!NSEqualSizes(self.bounds.size, NSZeroSize)) {
      image = RCTFillImagePreservingAspectRatio(image, self.bounds.size, self.window.backingScaleFactor ?: 1.0);
    }
#endif // macOS]
  } else if (!UIEdgeInsetsEqualToEdgeInsets(UIEdgeInsetsZero, _capInsets)) {
    // Applying capInsets of 0 will switch the "resizingMode" of the image to "tile" which is undesired
#if !TARGET_OS_OSX // [macOS]
    image = [image resizableImageWithCapInsets:_capInsets resizingMode:UIImageResizingModeStretch];
#else // [macOS
    image.capInsets = _capInsets;
    image.resizingMode = NSImageResizingModeStretch;
#endif // macOS]
  }

#if TARGET_OS_OSX // [macOS
  if ((_renderingMode == UIImageRenderingModeAlwaysTemplate) != [image isTemplate]) {
    [image setTemplate:(_renderingMode == UIImageRenderingModeAlwaysTemplate)];
  }
#endif // macOS]

  // Apply trilinear filtering to smooth out mis-sized images
  _imageView.layer.minificationFilter = kCAFilterTrilinear;
  _imageView.layer.magnificationFilter = kCAFilterTrilinear;

  _imageView.image = image;
}

- (void)setImage:(UIImage *)image
{
  image = image ?: _defaultImage;
  if (image != self.image) {
    _image = image; // [macOS]
    [self updateWithImage:image];
  }
}

- (UIImage *)image
{
  return _image ?: _imageView.image; // [macOS]
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
#if !TARGET_OS_OSX // [macOS]
      _imageView.contentMode = UIViewContentModeScaleToFill;
#else // [macOS
      _imageView.imageScaling = NSImageScaleAxesIndependently;
#endif // macOS]
    } else {
#if !TARGET_OS_OSX // [macOS]
      _imageView.contentMode = (UIViewContentMode)resizeMode;
#else // [macOS
      // This relies on having previously resampled the image to a size that exceeds the image view.
      if (resizeMode == RCTResizeModeCover) {
        resizeMode = RCTResizeModeCenter;
      }
      _imageView.imageScaling = (NSImageScaling)resizeMode;
#endif // macOS]
    }

    if ([self shouldReloadImageSourceAfterResize]) {
      _needsReload = YES;
    }
  }
}

- (void)setInternal_analyticTag:(NSString *)internal_analyticTag
{
  if (_internal_analyticTag != internal_analyticTag) {
    _internal_analyticTag = internal_analyticTag;
    _needsReload = YES;
  }
}

- (void)cancelImageLoad
{
  [_loaderRequest cancel];
  _pendingImageSource = nil;
}

- (void)cancelAndClearImageLoad
{
  [self cancelImageLoad];

  [_imageLoader trackURLImageRequestDidDestroy:_loaderRequest];
  _loaderRequest = nil;

  if (!self.image) {
    self.image = _defaultImage;
  }
}

#if !TARGET_OS_OSX // [macOS]
- (void)clearImageIfDetached
{
  if (!self.window) {
    [self cancelAndClearImageLoad];
    self.image = nil;
    _imageSource = nil;
  }
}
#endif // [macOS]

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

#if !TARGET_OS_OSX // [macOS]
  const CGFloat scale = RCTScreenScale();
#else // [macOS
  const CGFloat scale = self.window != nil ? self.window.backingScaleFactor : [NSScreen mainScreen].backingScaleFactor;
#endif // macOS]
  const CGFloat targetImagePixels = size.width * size.height * scale * scale;

  RCTImageSource *bestSource = nil;
  CGFloat bestFit = CGFLOAT_MAX;
  for (RCTImageSource *source in _imageSources) {
    CGSize imgSize = source.size;
    const CGFloat imagePixels = imgSize.width * imgSize.height * source.scale * source.scale;
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
  return ![desiredImageSource isEqual:_imageSource] && ![desiredImageSource isEqual:_pendingImageSource];
}

- (void)reloadImage
{
  [self cancelAndClearImageLoad];
  _needsReload = NO;

  RCTImageSource *source = [self imageSourceForSize:self.frame.size];
  _pendingImageSource = source;

  if (source && self.frame.size.width > 0 && self.frame.size.height > 0) {
    if (_onLoadStart) {
      _onLoadStart(nil);
    }

    RCTImageLoaderProgressBlock progressHandler = nil;
    if (self.onProgress) {
      RCTDirectEventBlock onProgress = self.onProgress;
      progressHandler = ^(int64_t loaded, int64_t total) {
        onProgress(@{
          @"loaded" : @((double)loaded),
          @"total" : @((double)total),
        });
      };
    }

    __weak RCTImageView *weakSelf = self;
    RCTImageLoaderPartialLoadBlock partialLoadHandler = ^(UIImage *image) {
      [weakSelf imageLoaderLoadedImage:image error:nil forImageSource:source partial:YES];
    };

    CGSize imageSize = self.bounds.size;
#if !TARGET_OS_OSX // [macOS]
    CGFloat imageScale = RCTScreenScale();
#else // [macOS
    CGFloat imageScale = self.window != nil ? self.window.backingScaleFactor : [NSScreen mainScreen].backingScaleFactor;
#endif // macOS]
    if (!UIEdgeInsetsEqualToEdgeInsets(_capInsets, UIEdgeInsetsZero)) {
      // Don't resize images that use capInsets
      imageSize = CGSizeZero;
      imageScale = source.scale;
    }

    RCTImageLoaderCompletionBlockWithMetadata completionHandler = ^(NSError *error, UIImage *loadedImage, id metadata) {
      [weakSelf imageLoaderLoadedImage:loadedImage error:error forImageSource:source partial:NO];
    };

    if (!_imageLoader) {
      _imageLoader = [_bridge moduleForName:@"ImageLoader" lazilyLoadIfNecessary:YES];
    }

    RCTImageURLLoaderRequest *loaderRequest =
        [_imageLoader loadImageWithURLRequest:source.request
                                         size:imageSize
                                        scale:imageScale
                                      clipped:NO
                                   resizeMode:_resizeMode
                                     priority:RCTImageLoaderPriorityImmediate
                                  attribution:{.nativeViewTag = [self.reactTag intValue],
                                               .surfaceId = [self.rootTag intValue],
                                               .analyticTag = self.internal_analyticTag}
                                progressBlock:progressHandler
                             partialLoadBlock:partialLoadHandler
                              completionBlock:completionHandler];
    _loaderRequest = loaderRequest;
  } else {
    [self cancelAndClearImageLoad];
  }
}

- (void)imageLoaderLoadedImage:(UIImage *)loadedImage
                         error:(NSError *)error
                forImageSource:(RCTImageSource *)source
                       partial:(BOOL)isPartialLoad
{
  if (![source isEqual:_pendingImageSource]) {
    // Bail out if source has changed since we started loading
    return;
  }

  if (error) {
    __weak RCTImageView *weakSelf = self;
    RCTExecuteOnMainQueue(^{
      weakSelf.image = nil;
    });

    if (_onError) {
      _onError(@{
        @"error" : error.localizedDescription,
        @"responseCode" : (error.userInfo[@"httpStatusCode"] ?: [NSNull null]),
        @"httpResponseHeaders" : (error.userInfo[@"httpResponseHeaders"] ?: [NSNull null])
      });
    }
    if (_onLoadEnd) {
      _onLoadEnd(nil);
    }
    return;
  }

  __weak RCTImageView *weakSelf = self;
  void (^setImageBlock)(UIImage *) = ^(UIImage *image) {
    RCTImageView *strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }
    if (!isPartialLoad) {
      strongSelf->_imageSource = source;
      strongSelf->_pendingImageSource = nil;
    }

    strongSelf.image = image;

    if (isPartialLoad) {
      if (strongSelf->_onPartialLoad) {
        strongSelf->_onPartialLoad(nil);
      }
    } else {
      if (strongSelf->_onLoad) {
        RCTImageSource *sourceLoaded = [source imageSourceWithSize:image.size scale:source.scale];
        strongSelf->_onLoad(onLoadParamsForSource(sourceLoaded));
      }
      if (strongSelf->_onLoadEnd) {
        strongSelf->_onLoadEnd(nil);
      }
    }
  };

  if (_blurRadius > __FLT_EPSILON__) {
    // Blur on a background thread to avoid blocking interaction
    CGFloat blurRadius = self.blurRadius;
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      UIImage *blurredImage = RCTBlurredImageWithRadius(loadedImage, blurRadius);
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
    CGFloat imageScale = UIImageGetScale(self.image); // [macOS]
#if !TARGET_OS_OSX // [macOS]
    CGFloat windowScale = RCTScreenScale();
    RCTResizeMode resizeMode = (RCTResizeMode)_imageView.contentMode; // [macOS]
#else // [macOS
    CGFloat windowScale = self.window != nil ? self.window.backingScaleFactor : [NSScreen mainScreen].backingScaleFactor;
    RCTResizeMode resizeMode = self.resizeMode;

    // self.contentMode on iOS is translated to RCTResizeModeRepeat in -setResizeMode:
    if (resizeMode == RCTResizeModeRepeat) {
      resizeMode = RCTResizeModeStretch;
    }
#endif // macOS]
    CGSize idealSize = RCTTargetSize(imageSize, imageScale, frame.size, windowScale,
                                       resizeMode, YES); // macOS]
    // Don't reload if the current image or target image size is close enough
    if ((!RCTShouldReloadImageForSizeChange(imageSize, idealSize) ||
         !RCTShouldReloadImageForSizeChange(_targetSize, idealSize)) // [macOS
#if TARGET_OS_OSX
         // Since macOS doen't support UIViewContentModeScaleAspectFill, we have to manually resample the image
         // If we're in cover mode we need to ensure that the image is re-sampled to the correct size when the container size (shrinking 
         // being the most obvious case) otherwise we will end up in a state an image will not properly scale inside its container
         && (resizeMode != RCTResizeModeCover || (imageSize.width == idealSize.width && imageSize.height == idealSize.height))
#endif
         ) { // macOS]
      return;
    }

    // Don't reload if the current image size is the maximum size of either the pending image source or image source
    CGSize imageSourceSize = (_imageSource ? _imageSource : _pendingImageSource).size;
    if (imageSize.width * imageScale == imageSourceSize.width * _imageSource.scale &&
        imageSize.height * imageScale == imageSourceSize.height * _imageSource.scale) {
      return;
    }

    RCTLogInfo(
        @"Reloading image %@ as size %@", _imageSource.request.URL.absoluteString, NSStringFromCGSize(idealSize));

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

#if TARGET_OS_OSX // [macOS
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
#endif // macOS]
- (void)didMoveToWindow
{
  [super didMoveToWindow];

#if TARGET_OS_OSX // [macOS
  if (!_subscribedToWindowBackingNotifications && self.window != nil) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(windowDidChangeBackingProperties:)
                                                 name:NSWindowDidChangeBackingPropertiesNotification
                                               object:self.window];
    _subscribedToWindowBackingNotifications = YES;
  }
#endif // macOS]
  if (!self.window) {
    // Cancel loading the image if we've moved offscreen. In addition to helping
    // prioritise image requests that are actually on-screen, this removes
    // requests that have gotten "stuck" from the queue, unblocking other images
    // from loading.
    // Do not clear _loaderRequest because this component can be visible again without changing image source
    [self cancelImageLoad];
  } else if ([self shouldChangeImageSource]) {
    [self reloadImage];
  }
}
    
#if TARGET_OS_OSX // [macOS
- (void)windowDidChangeBackingProperties:(NSNotification *)notification
{
  [self reloadImage];
}
  
- (RCTPlatformView *)reactAccessibilityElement
{
  return _imageView;
}

- (NSColor *)tintColor
{
  return _imageView.contentTintColor;
}

- (void)setTintColor:(NSColor *)tintColor
{
  _imageView.contentTintColor = tintColor;
}
#endif // macOS]

- (void)dealloc
{
  [_imageLoader trackURLImageDidDestroy:_loaderRequest];
}

@end
