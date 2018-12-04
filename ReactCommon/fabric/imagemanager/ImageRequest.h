/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <mutex>

#include <folly/futures/Future.h>
#include <folly/futures/FutureSplitter.h>
#include <react/imagemanager/ImageResponse.h>
#include <react/imagemanager/primitives.h>

namespace facebook {
namespace react {

/*
 * Represents ongoing request for an image resource.
 * The separate object must be constructed for every single separate
 * image request. The object cannot be copied because it would make managing of
 * event listeners hard and inefficient; the object can be moved though.
 * To subscribe for notifications use `getResponseFuture()` method.
 * Destroy to cancel the underlying request.
 */
class ImageRequest final {
 public:
  /*
   * The exception which is thrown when `ImageRequest` is being deallocated
   * if the future is not ready yet.
   */
  class ImageNoLongerNeededException;

  ImageRequest();

  /*
   * `ImageRequest` is constructed with `ImageSource` and
   * `ImageResponse` future which must be moved in inside the object.
   */
  ImageRequest(
      const ImageSource &imageSource,
      folly::Future<ImageResponse> &&responseFuture);

  /*
   * The move constructor.
   */
  ImageRequest(ImageRequest &&other) noexcept;

  /*
   * `ImageRequest` does not support copying by design.
   */
  ImageRequest(const ImageRequest &) = delete;

  ~ImageRequest();

  /*
   * Creates and returns a *new* future object with promised `ImageResponse`
   * result. Multiple consumers can call this method many times to create
   * their own subscriptions to promised value.
   */
  folly::Future<ImageResponse> getResponseFuture() const;

 private:
  /*
   * Mutext to protect an access to the future.
   */
  mutable std::mutex mutex_;

  /*
   * Image source assosiated with the request.
   */
  ImageSource imageSource_;

  /*
   * Future splitter powers factory-like `getResponseFuture()` method.
   */
  mutable folly::FutureSplitter<ImageResponse> responseFutureSplitter_;

  /*
   * Indicates that the object was moved and hence cannot be used anymore.
   */
  bool moved_{false};
};

} // namespace react
} // namespace facebook
