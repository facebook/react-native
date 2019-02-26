/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/imagemanager/ImageResponse.h>
#include <react/imagemanager/ImageResponseObserver.h>

#include <folly/SharedMutex.h>
#include <shared_mutex>
#include <vector>

namespace facebook {
namespace react {

/*
 * The ImageResponseObserverCoordinator receives events and completed image
 * data from native image loaders and sends events to any observers attached
 * to the coordinator. The Coordinator also keeps track of response status
 * and caches completed images.
 */
class ImageResponseObserverCoordinator {
 public:
  /*
   * Default constructor.
   */
  ImageResponseObserverCoordinator();

  /*
   * Default destructor.
   */
  ~ImageResponseObserverCoordinator();

  /*
   * Interested parties may observe the image response.
   */
  void addObserver(ImageResponseObserver *observer) const;

  /*
   * Interested parties may stop observing the image response.
   */
  void removeObserver(ImageResponseObserver *observer) const;

  /*
   * Platform-specific image loader will call this method with progress updates.
   */
  void nativeImageResponseProgress(float) const;

  /*
   * Platform-specific image loader will call this method with a completed image
   * response.
   */
  void nativeImageResponseComplete(const ImageResponse &imageResponse) const;

  /*
   * Platform-specific image loader will call this method in case of any
   * failures.
   */
  void nativeImageResponseFailed() const;

 private:
  /*
   * List of observers.
   * Mutable: protected by mutex_.
   */
  mutable std::vector<ImageResponseObserver *> observers_;

  /*
   * Current status of image loading.
   * Mutable: protected by mutex_.
   */
  mutable ImageResponse::Status status_;

  /*
   * Cache image data.
   * Mutable: protected by mutex_.
   */
  mutable std::shared_ptr<void> imageData_{};

  /*
   * Observer and data mutex.
   */
  mutable folly::SharedMutex mutex_;
};

} // namespace react
} // namespace facebook
