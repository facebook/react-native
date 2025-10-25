/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageFetcher.h"

#include <react/common/mapbuffer/JReadableMapBuffer.h>
#include <react/renderer/imagemanager/conversions.h>

namespace facebook::react {

ImageFetcher::ImageFetcher(
    std::shared_ptr<const ContextContainer> contextContainer)
    : contextContainer_(std::move(contextContainer)) {}

ImageRequest ImageFetcher::requestImage(
    const ImageSource& imageSource,
    SurfaceId surfaceId,
    const ImageRequestParams& imageRequestParams,
    Tag tag) {
  auto telemetry = std::make_shared<ImageTelemetry>(surfaceId);

  auto fabricUIManager_ =
      contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");
  static auto prefetchResource =
      fabricUIManager_->getClass()
          ->getMethod<void(
              SurfaceId, std::string, JReadableMapBuffer::javaobject, Tag)>(
              "experimental_prefetchResource");

  auto readableMapBuffer = JReadableMapBuffer::createWithContents(
      serializeImageRequest(imageSource, imageRequestParams));
  prefetchResource(
      fabricUIManager_,
      surfaceId,
      "RCTImageView",
      readableMapBuffer.get(),
      tag);

  return {imageSource, telemetry};
}

} // namespace facebook::react
