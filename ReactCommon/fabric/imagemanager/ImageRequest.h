/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/imagemanager/ImageResponse.h>
#include <react/imagemanager/ImageResponseObserver.h>
#include <react/imagemanager/ImageResponseObserverCoordinator.h>
#include <react/imagemanager/primitives.h>

namespace facebook {
namespace react {

/*
 * Represents ongoing request for an image resource.
 * The separate object must be constructed for every single separate
 * image request. The object cannot be copied because it would make managing of
 * event listeners hard and inefficient; the object can be moved though.
 * Destroy to cancel the underlying request.
 */
class ImageRequest final {
 public:
  /*
   * The exception which is thrown when `ImageRequest` is being deallocated
   * if the future is not ready yet.
   */
  class ImageNoLongerNeededException;

  /*
   * The default constructor
   */
  ImageRequest(const ImageSource &imageSource);

  /*
   * The move constructor.
   */
  ImageRequest(ImageRequest &&other) noexcept;

  /*
   * `ImageRequest` does not support copying by design.
   */
  ImageRequest(const ImageRequest &other) = delete;

  ~ImageRequest();

  /**
   * Set cancelation function.
   */
  void setCancelationFunction(std::function<void(void)> cancelationFunction);

  /*
   * Get observer coordinator.
   */
  const ImageResponseObserverCoordinator *getObserverCoordinator() const;

 private:
  /*
   * Image source assosiated with the request.
   */
  ImageSource imageSource_;

  /*
   * Event coordinator associated with the reqest.
   */
  std::shared_ptr<const ImageResponseObserverCoordinator> coordinator_{};

  /*
   * Function we can call to cancel image request (see destructor).
   */
  std::function<void(void)> cancelRequest_;

  /*
   * Indicates that the object was moved and hence cannot be used anymore.
   */
  bool moved_{false};
};

} // namespace react
} // namespace facebook
