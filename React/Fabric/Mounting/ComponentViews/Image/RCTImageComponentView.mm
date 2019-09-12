/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTImageComponentView.h"

#import <React/RCTImageResponseObserverProxy.h>
#import <react/components/image/ImageComponentDescriptor.h>
#import <react/components/image/ImageEventEmitter.h>
#import <react/components/image/ImageLocalData.h>
#import <react/components/image/ImageProps.h>
#import <react/imagemanager/ImageRequest.h>
#import <react/imagemanager/RCTImagePrimitivesConversions.h>

#import "RCTConversions.h"

@implementation RCTImageComponentView {
  UIImageView *_imageView;
  SharedImageLocalData _imageLocalData;
  const ImageResponseObserverCoordinator *_coordinator;
  std::unique_ptr<RCTImageResponseObserverProxy> _imageResponseObserverProxy;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ImageProps>();
    _props = defaultProps;

    _imageView = [[UIImageView alloc] initWithFrame:self.bounds];
    _imageView.clipsToBounds = YES;

    _imageView.contentMode = (UIViewContentMode)RCTResizeModeFromImageResizeMode(defaultProps->resizeMode);

    _imageResponseObserverProxy = std::make_unique<RCTImageResponseObserverProxy>((__bridge void *)self);

    self.contentView = _imageView;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ImageComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldImageProps = *std::static_pointer_cast<const ImageProps>(_props);
  const auto &newImageProps = *std::static_pointer_cast<const ImageProps>(props);

  // `resizeMode`
  if (oldImageProps.resizeMode != newImageProps.resizeMode) {
    if (newImageProps.resizeMode == ImageResizeMode::Repeat) {
      // Repeat resize mode is handled by the UIImage. Use scale to fill
      // so the repeated image fills the UIImageView.
      _imageView.contentMode = UIViewContentModeScaleToFill;
    } else {
      _imageView.contentMode = (UIViewContentMode)RCTResizeModeFromImageResizeMode(newImageProps.resizeMode);
    }
  }

  // `tintColor`
  if (oldImageProps.tintColor != newImageProps.tintColor) {
    _imageView.tintColor = [UIColor colorWithCGColor:newImageProps.tintColor.get()];
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)updateLocalData:(SharedLocalData)localData oldLocalData:(SharedLocalData)oldLocalData
{
  auto imageLocalData = std::static_pointer_cast<const ImageLocalData>(localData);

  // This call (setting `coordinator`) must be unconditional (at the same block as setting `LocalData`)
  // because the setter stores a raw pointer to object that `LocalData` owns.
  self.coordinator = imageLocalData ? &imageLocalData->getImageRequest().getObserverCoordinator() : nullptr;

  auto previousData = _imageLocalData;
  _imageLocalData = imageLocalData;

  if (!_imageLocalData) {
    // This might happen in very rare cases (e.g. inside a subtree inside a node with `display: none`).
    // That's quite normal.
    return;
  }

  bool havePreviousData = previousData != nullptr;

  if (!havePreviousData || _imageLocalData->getImageSource() != previousData->getImageSource()) {
    // Loading actually starts a little before this, but this is the first time we know
    // the image is loading and can fire an event from this component
    std::static_pointer_cast<const ImageEventEmitter>(_eventEmitter)->onLoadStart();
  }
}

- (void)setCoordinator:(const ImageResponseObserverCoordinator *)coordinator
{
  if (_coordinator) {
    _coordinator->removeObserver(_imageResponseObserverProxy.get());
  }
  _coordinator = coordinator;
  if (_coordinator != nullptr) {
    _coordinator->addObserver(_imageResponseObserverProxy.get());
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  self.coordinator = nullptr;
  _imageView.image = nil;
  _imageLocalData.reset();
}

- (void)dealloc
{
  self.coordinator = nullptr;
  _imageResponseObserverProxy.reset();
}

#pragma mark - RCTImageResponseDelegate

- (void)didReceiveImage:(UIImage *)image fromObserver:(void *)observer
{
  if (!_eventEmitter) {
    // Notifications are delivered asynchronously and might arrive after the view is already recycled.
    // In the future, we should incorporate an `EventEmitter` into a separate object owned by `ImageRequest` or `State`.
    // See for more info: T46311063.
    return;
  }

  std::static_pointer_cast<const ImageEventEmitter>(_eventEmitter)->onLoad();

  const auto &imageProps = *std::static_pointer_cast<const ImageProps>(_props);

  if (imageProps.tintColor) {
    image = [image imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
  }

  if (imageProps.resizeMode == ImageResizeMode::Repeat) {
    image = [image resizableImageWithCapInsets:RCTUIEdgeInsetsFromEdgeInsets(imageProps.capInsets)
                                  resizingMode:UIImageResizingModeTile];
  } else if (imageProps.capInsets != EdgeInsets()) {
    // Applying capInsets of 0 will switch the "resizingMode" of the image to "tile" which is undesired.
    image = [image resizableImageWithCapInsets:RCTUIEdgeInsetsFromEdgeInsets(imageProps.capInsets)
                                  resizingMode:UIImageResizingModeStretch];
  }

  self->_imageView.image = image;

  // Apply trilinear filtering to smooth out mis-sized images.
  self->_imageView.layer.minificationFilter = kCAFilterTrilinear;
  self->_imageView.layer.magnificationFilter = kCAFilterTrilinear;

  std::static_pointer_cast<const ImageEventEmitter>(self->_eventEmitter)->onLoadEnd();
}

- (void)didReceiveProgress:(float)progress fromObserver:(void *)observer
{
  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<const ImageEventEmitter>(_eventEmitter)->onProgress(progress);
}

- (void)didReceiveFailureFromObserver:(void *)observer
{
  if (!_eventEmitter) {
    return;
  }

  _imageView.image = nil;

  std::static_pointer_cast<const ImageEventEmitter>(_eventEmitter)->onError();
}

@end
