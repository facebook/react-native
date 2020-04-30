/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageManager.h"

#import <React/RCTImageLoaderWithAttributionProtocol.h>
#import <react/utils/ManagedObjectWrapper.h>

#import "RCTImageManager.h"

namespace facebook {
namespace react {

ImageManager::ImageManager(ContextContainer::Shared const &contextContainer)
{
  id<RCTImageLoaderWithAttributionProtocol> imageLoader =
      (id<RCTImageLoaderWithAttributionProtocol>)unwrapManagedObject(
          contextContainer->at<std::shared_ptr<void>>("RCTImageLoader"));
  self_ = (__bridge_retained void *)[[RCTImageManager alloc] initWithImageLoader:imageLoader];
}

ImageManager::~ImageManager()
{
  CFRelease(self_);
  self_ = nullptr;
}

ImageRequest ImageManager::requestImage(const ImageSource &imageSource, SurfaceId surfaceId) const
{
  RCTImageManager *imageManager = (__bridge RCTImageManager *)self_;
  return [imageManager requestImage:imageSource surfaceId:surfaceId];
}

} // namespace react
} // namespace facebook
