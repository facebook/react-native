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
#import <react/imagemanager/ImageRequest.h>
#import <react/imagemanager/ImageResponse.h>
#import <react/imagemanager/RCTImagePrimitivesConversions.h>

#import "RCTConversions.h"
#import "MainQueueExecutor.h"

using namespace facebook::react;

@implementation RCTImageComponentView {
  UIImageView *_imageView;
  SharedImageLocalData _imageLocalData;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ImageProps>();
    _props = defaultProps;

    _imageView = [[UIImageView alloc] initWithFrame:self.bounds];
    _imageView.clipsToBounds = YES;

    _imageView.contentMode = (UIViewContentMode)RCTResizeModeFromImageResizeMode(defaultProps->resizeMode);

    self.contentView = _imageView;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

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
  auto future = _imageLocalData->getImageRequest().getResponseFuture();
  future.via(&MainQueueExecutor::instance()).thenValue([self](ImageResponse &&imageResponse) {
    self.image = (__bridge UIImage *)imageResponse.getImage().get();
  });
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _imageView.image = nil;
  _imageLocalData.reset();
}

#pragma mark - Other

- (void)setImage:(UIImage *)image
{
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

  _imageView.image = image;

  // Apply trilinear filtering to smooth out mis-sized images.
  _imageView.layer.minificationFilter = kCAFilterTrilinear;
  _imageView.layer.magnificationFilter = kCAFilterTrilinear;
}

@end
