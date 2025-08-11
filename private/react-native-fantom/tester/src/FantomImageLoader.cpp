/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FantomImageLoader.h"

#include <utility>

namespace facebook::react {

void FantomImageLoader::setImageResponse(
    const std::string& uri,
    ImageResponse imageResponse) {
  images_[uri] = std::move(imageResponse);
}

void FantomImageLoader::clearImage(const std::string& uri) {
  images_.erase(uri);
}

void FantomImageLoader::clearAllImages() {
  images_.clear();
}

void FantomImageLoader::loadImage(
    const std::string& uri,
    const IImageLoaderOnLoadCallback&& onLoad) {
  if (images_.contains(uri)) {
    onLoad(
        images_[uri].width,
        images_[uri].height,
        images_[uri].errorMessage.has_value()
            ? images_[uri].errorMessage.value().c_str()
            : nullptr);
    return;
  }

  onLoad(0, 0, "image not loaded");
}

IImageLoader::CacheStatus FantomImageLoader::getCacheStatus(
    const std::string& uri) {
  if (images_.contains(uri) && images_[uri].cacheStatus.has_value()) {
    std::string cacheStatus = images_[uri].cacheStatus.value();
    if (cacheStatus == "disk") {
      return IImageLoader::CacheStatus::Disk;
    } else if (cacheStatus == "memory") {
      return IImageLoader::CacheStatus::Memory;
    } else if (cacheStatus == "disk/memory") {
      return static_cast<IImageLoader::CacheStatus>(
          static_cast<int>(IImageLoader::CacheStatus::Disk) |
          static_cast<int>(IImageLoader::CacheStatus::Memory));
    }
  }
  return IImageLoader::CacheStatus::None;
}

} // namespace facebook::react
