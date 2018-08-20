/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTImageComponentView.h"

#import <fabric/components/image/ImageEventEmitter.h>
#import <fabric/components/image/ImageLocalData.h>
#import <fabric/components/image/ImageProps.h>
#import <fabric/imagemanager/ImageRequest.h>
#import <fabric/imagemanager/ImageResponse.h>
#import <fabric/imagemanager/RCTImagePrimitivesConversions.h>

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
    _imageView = [[UIImageView alloc] initWithFrame:self.bounds];
    _imageView.clipsToBounds = YES;

    auto defaultProps = ImageProps();
    _imageView.contentMode = (UIViewContentMode)RCTResizeModeFromImageResizeMode(defaultProps.resizeMode);

    self.contentView = _imageView;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

- (void)updateProps:(SharedProps)props oldProps:(SharedProps)oldProps
{
  if (!oldProps) {
    oldProps = _props ?: std::make_shared<const ImageProps>();
  }
  _props = props;

  [super updateProps:props oldProps:oldProps];

  const auto &oldImageProps = *std::dynamic_pointer_cast<const ImageProps>(oldProps);
  const auto &newImageProps = *std::dynamic_pointer_cast<const ImageProps>(props);

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
  future.via(&MainQueueExecutor::instance()).then([self](ImageResponse &&imageResponse) {
    self.image = (__bridge_transfer UIImage *)imageResponse.getImage().get();
  });
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _imageView.image = nil;
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
