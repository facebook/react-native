/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTImageComponentView.h"

#import <React/RCTAssert.h>
#import <React/RCTConversions.h>
#import <React/RCTImageBlurUtils.h>
#import <React/RCTImageResponseObserverProxy.h>
#import <react/renderer/components/image/ImageComponentDescriptor.h>
#import <react/renderer/components/image/ImageEventEmitter.h>
#import <react/renderer/components/image/ImageProps.h>
#import <react/renderer/imagemanager/ImageRequest.h>
#import <react/renderer/imagemanager/RCTImagePrimitivesConversions.h>
#import <react/utils/CoreFeatures.h>

using namespace facebook::react;

@implementation RCTImageComponentView {
  ImageShadowNode::ConcreteState::Shared _state;
  RCTImageResponseObserverProxy _imageResponseObserverProxy;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ImageProps>();
    _props = defaultProps;

    _imageView = [RCTUIImageViewAnimated new];
    _imageView.clipsToBounds = YES;
    _imageView.contentMode = RCTContentModeFromImageResizeMode(defaultProps->resizeMode);
    _imageView.layer.minificationFilter = kCAFilterTrilinear;
    _imageView.layer.magnificationFilter = kCAFilterTrilinear;

    _imageResponseObserverProxy = RCTImageResponseObserverProxy(self);

    self.contentView = _imageView;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ImageComponentDescriptor>();
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldImageProps = static_cast<const ImageProps &>(*_props);
  const auto &newImageProps = static_cast<const ImageProps &>(*props);

  // `resizeMode`
  if (oldImageProps.resizeMode != newImageProps.resizeMode) {
    _imageView.contentMode = RCTContentModeFromImageResizeMode(newImageProps.resizeMode);
  }

  // `tintColor`
  if (oldImageProps.tintColor != newImageProps.tintColor) {
    _imageView.tintColor = RCTUIColorFromSharedColor(newImageProps.tintColor);
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState
{
  RCTAssert(state, @"`state` must not be null.");
  RCTAssert(
      std::dynamic_pointer_cast<ImageShadowNode::ConcreteState const>(state),
      @"`state` must be a pointer to `ImageShadowNode::ConcreteState`.");

  auto oldImageState = std::static_pointer_cast<ImageShadowNode::ConcreteState const>(_state);
  auto newImageState = std::static_pointer_cast<ImageShadowNode::ConcreteState const>(state);

  [self _setStateAndResubscribeImageResponseObserver:newImageState];

  bool havePreviousData = oldImageState && oldImageState->getData().getImageSource() != ImageSource{};

  if (!havePreviousData ||
      (newImageState && newImageState->getData().getImageSource() != oldImageState->getData().getImageSource())) {
    // Loading actually starts a little before this, but this is the first time we know
    // the image is loading and can fire an event from this component
    static_cast<const ImageEventEmitter &>(*_eventEmitter).onLoadStart();

    // TODO (T58941612): Tracking for visibility should be done directly on this class.
    // For now, we consolidate instrumentation logic in the image loader, so that pre-Fabric gets the same treatment.
  }
}

- (void)_setStateAndResubscribeImageResponseObserver:(const ImageShadowNode::ConcreteState::Shared &)state
{
  if (_state) {
    const auto &imageRequest = _state->getData().getImageRequest();
    auto &observerCoordinator = imageRequest.getObserverCoordinator();
    observerCoordinator.removeObserver(_imageResponseObserverProxy);
    if (CoreFeatures::cancelImageDownloadsOnRecycle) {
      // Cancelling image request because we are no longer observing it.
      // This is not 100% correct place to do this because we may want to
      // re-create RCTImageComponentView with the same image and if it
      // was cancelled before downloaded, download is not resumed.
      // This will only become issue if we decouple life cycle of a
      // ShadowNode from ComponentView, which is not something we do now.
      imageRequest.cancel();
    }
  }

  _state = state;

  if (_state) {
    auto &observerCoordinator = _state->getData().getImageRequest().getObserverCoordinator();
    observerCoordinator.addObserver(_imageResponseObserverProxy);
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [self _setStateAndResubscribeImageResponseObserver:nullptr];
  _imageView.image = nil;
}

#pragma mark - RCTImageResponseDelegate

- (void)didReceiveImage:(UIImage *)image metadata:(id)metadata fromObserver:(const void *)observer
{
  if (!_eventEmitter || !_state) {
    // Notifications are delivered asynchronously and might arrive after the view is already recycled.
    // In the future, we should incorporate an `EventEmitter` into a separate object owned by `ImageRequest` or `State`.
    // See for more info: T46311063.
    return;
  }

  static_cast<const ImageEventEmitter &>(*_eventEmitter).onLoad();
  static_cast<const ImageEventEmitter &>(*_eventEmitter).onLoadEnd();

  const auto &imageProps = static_cast<const ImageProps &>(*_props);

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

  if (imageProps.blurRadius > __FLT_EPSILON__) {
    // Blur on a background thread to avoid blocking interaction.
    CGFloat blurRadius = imageProps.blurRadius;
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      UIImage *blurredImage = RCTBlurredImageWithRadius(image, blurRadius);
      RCTExecuteOnMainQueue(^{
        self->_imageView.image = blurredImage;
      });
    });
  } else {
    self->_imageView.image = image;
  }
}

- (void)didReceiveProgress:(float)progress fromObserver:(const void *)observer
{
  if (!_eventEmitter) {
    return;
  }

  static_cast<const ImageEventEmitter &>(*_eventEmitter).onProgress(progress);
}

- (void)didReceiveFailureFromObserver:(const void *)observer
{
  _imageView.image = nil;

  if (!_eventEmitter) {
    return;
  }

  static_cast<const ImageEventEmitter &>(*_eventEmitter).onError();
  static_cast<const ImageEventEmitter &>(*_eventEmitter).onLoadEnd();
}

@end

#ifdef __cplusplus
extern "C" {
#endif

// Can't the import generated Plugin.h because plugins are not in this BUCK target
Class<RCTComponentViewProtocol> RCTImageCls(void);

#ifdef __cplusplus
}
#endif

Class<RCTComponentViewProtocol> RCTImageCls(void)
{
  return RCTImageComponentView.class;
}
