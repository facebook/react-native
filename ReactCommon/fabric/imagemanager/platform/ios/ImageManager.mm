/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageManager.h"

#import <React/RCTImageLoader.h>
#import <react/utils/ManagedObjectWrapper.h>

#import "RCTImageManager.h"

namespace facebook {
namespace react {

ImageManager::ImageManager(ContextContainer::Shared const &contextContainer)
{
  RCTImageLoader *imageLoader =
      (RCTImageLoader *)unwrapManagedObject(contextContainer->getInstance<std::shared_ptr<void>>("RCTImageLoader"));
  self_ = (__bridge_retained void *)[[RCTImageManager alloc] initWithImageLoader:imageLoader];
}

ImageManager::~ImageManager() {
  CFRelease(self_);
  self_ = nullptr;
}

ImageRequest ImageManager::requestImage(const ImageSource &imageSource) const {
  RCTImageManager *imageManager = (__bridge RCTImageManager *)self_;
  return [imageManager requestImage:imageSource];
}

} // namespace react
} // namespace facebook
