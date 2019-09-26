/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageResponseObserverCoordinator.h"

#include <algorithm>

namespace facebook {
namespace react {

ImageResponseObserverCoordinator::ImageResponseObserverCoordinator() {
  status_ = ImageResponse::Status::Loading;
}

ImageResponseObserverCoordinator::~ImageResponseObserverCoordinator() {}

void ImageResponseObserverCoordinator::addObserver(
    ImageResponseObserver *observer) const {
  ImageResponse::Status status = [this] {
    std::shared_lock<better::shared_mutex> read(mutex_);
    return status_;
  }();

  if (status == ImageResponse::Status::Loading) {
    std::unique_lock<better::shared_mutex> write(mutex_);
    observers_.push_back(observer);
  } else if (status == ImageResponse::Status::Completed) {
    ImageResponse imageResponseCopy = [this] {
      std::unique_lock<better::shared_mutex> read(mutex_);
      return ImageResponse(imageData_);
    }();
    observer->didReceiveImage(imageResponseCopy);
  } else {
    observer->didReceiveFailure();
  }
}

void ImageResponseObserverCoordinator::removeObserver(
    ImageResponseObserver *observer) const {
  std::unique_lock<better::shared_mutex> write(mutex_);

  auto position = std::find(observers_.begin(), observers_.end(), observer);
  if (position != observers_.end()) {
    observers_.erase(position, observers_.end());
  }
}

void ImageResponseObserverCoordinator::nativeImageResponseProgress(
    float progress) const {
  std::vector<ImageResponseObserver *> observersCopy = [this] {
    std::shared_lock<better::shared_mutex> read(mutex_);
    return observers_;
  }();

  for (auto observer : observersCopy) {
    observer->didReceiveProgress(progress);
  }
}

void ImageResponseObserverCoordinator::nativeImageResponseComplete(
    const ImageResponse &imageResponse) const {
  {
    std::unique_lock<better::shared_mutex> write(mutex_);
    imageData_ = imageResponse.getImage();
    status_ = ImageResponse::Status::Completed;
  }

  std::vector<ImageResponseObserver *> observersCopy = [this] {
    std::shared_lock<better::shared_mutex> read(mutex_);
    return observers_;
  }();

  for (auto observer : observersCopy) {
    ImageResponse imageResponseCopy = [this] {
      std::unique_lock<better::shared_mutex> read(mutex_);
      return ImageResponse(imageData_);
    }();
    observer->didReceiveImage(imageResponseCopy);
  }
}

void ImageResponseObserverCoordinator::nativeImageResponseFailed() const {
  {
    std::unique_lock<better::shared_mutex> write(mutex_);
    status_ = ImageResponse::Status::Failed;
  }

  std::vector<ImageResponseObserver *> observersCopy = [this] {
    std::shared_lock<better::shared_mutex> read(mutex_);
    return observers_;
  }();

  for (auto observer : observersCopy) {
    observer->didReceiveFailure();
  }
}

} // namespace react
} // namespace facebook
