/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTImageComponentView.h"

#import <react/components/image/ImageEventEmitter.h>
#import <react/components/image/ImageLocalData.h>
#import <react/components/image/ImageProps.h>
#import <react/components/image/ImageShadowNode.h>
#import <react/imagemanager/ImageRequest.h>
#import <react/imagemanager/ImageResponse.h>
#import <react/imagemanager/ImageResponseObserver.h>
#import <react/imagemanager/RCTImagePrimitivesConversions.h>

#import "RCTConversions.h"
#import "MainQueueExecutor.h"

using namespace facebook::react;

class ImageResponseObserverProxy: public ImageResponseObserver {
public:
    ImageResponseObserverProxy(void* delegate): delegate_((__bridge id<RCTImageResponseDelegate>)delegate) {}

    void didReceiveImage(const ImageResponse &imageResponse) override {
      UIImage *image = (__bridge UIImage *)imageResponse.getImage().get();
      void *this_ = this;
      dispatch_async(dispatch_get_main_queue(), ^{
        [delegate_ didReceiveImage:image fromObserver:this_];
      });
    }

    void didReceiveProgress (float p) override {
      void *this_ = this;
      dispatch_async(dispatch_get_main_queue(), ^{
        [delegate_ didReceiveProgress:p fromObserver:this_];
      });
    }
    void didReceiveFailure() override {
      void *this_ = this;
      dispatch_async(dispatch_get_main_queue(), ^{
        [delegate_ didReceiveFailureFromObserver:this_];
      });
    }

private:
  id<RCTImageResponseDelegate> delegate_;
};

@implementation RCTImageComponentView {
  UIImageView *_imageView;
  SharedImageLocalData _imageLocalData;
  std::shared_ptr<const ImageResponseObserverCoordinator> _coordinator;
  std::unique_ptr<ImageResponseObserverProxy> _imageResponseObserverProxy;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ImageProps>();
    _props = defaultProps;

    _imageView = [[UIImageView alloc] initWithFrame:self.bounds];
    _imageView.clipsToBounds = YES;

    _imageView.contentMode = (UIViewContentMode)RCTResizeModeFromImageResizeMode(defaultProps->resizeMode);
      
    _imageResponseObserverProxy = std::make_unique<ImageResponseObserverProxy>((__bridge void *)self);

    self.contentView = _imageView;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentHandle)componentHandle
{
  return ImageShadowNode::Handle();
}

- (void)updateProps:(SharedProps)props oldProps:(SharedProps)oldProps
{
  const auto &oldImageProps = *std::static_pointer_cast<const ImageProps>(oldProps ?: _props);
  const auto &newImageProps = *std::static_pointer_cast<const ImageProps>(props);

  [super updateProps:props oldProps:oldProps];

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
}

- (void)updateLocalData:(SharedLocalData)localData
           oldLocalData:(SharedLocalData)oldLocalData
{
  _imageLocalData = std::static_pointer_cast<const ImageLocalData>(localData);
  assert(_imageLocalData);
  self.coordinator = _imageLocalData->getImageRequest().getObserverCoordinator();
  
  // Loading actually starts a little before this
  std::static_pointer_cast<const ImageEventEmitter>(_eventEmitter)->onLoadStart();
}

- (void)setCoordinator:(std::shared_ptr<const ImageResponseObserverCoordinator>)coordinator {
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

-(void)dealloc
{
  self.coordinator = nullptr;
  _imageResponseObserverProxy.reset();
}

#pragma mark - RCTImageResponseDelegate

- (void)didReceiveImage:(UIImage *)image fromObserver:(void*)observer
{
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

- (void)didReceiveProgress:(float)progress fromObserver:(void*)observer {
  std::static_pointer_cast<const ImageEventEmitter>(_eventEmitter)->onProgress(progress);
}

- (void)didReceiveFailureFromObserver:(void*)observer {
  std::static_pointer_cast<const ImageEventEmitter>(_eventEmitter)->onError();
}


@end
