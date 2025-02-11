/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageFetcher.h"
#include <react/renderer/imagemanager/conversions.h>

namespace facebook::react {

ImageRequest ImageFetcher::requestImage(
    const ImageSource& imageSource,
    const ImageRequestParams& imageRequestParams,
    SurfaceId surfaceId,
    Tag tag) const {
  auto fabricUIManager_ =
      contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");
  static auto requestImage =
      fabricUIManager_->getClass()
          ->getMethod<void(
              std::string, SurfaceId, Tag, JReadableMapBuffer::javaobject)>(
              "experimental_prefetchResource");

  auto serializedImageRequest =
      serializeImageRequest(imageSource, imageRequestParams);

  auto readableMapBuffer =
      JReadableMapBuffer::createWithContents(std::move(serializedImageRequest));

  requestImage(
      fabricUIManager_,
      "RCTImageView",
      surfaceId,
      tag,
      readableMapBuffer.get());

  auto telemetry = std::make_shared<ImageTelemetry>(surfaceId);

  return {imageSource, telemetry};
}
} // namespace facebook::react
