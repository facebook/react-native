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

ImageRequest ImageFetcher::requestImage(
    const ImageSource& imageSource,
    SurfaceId surfaceId,
    const ImageRequestParams& imageRequestParams,
    Tag tag) {
  items_.emplace_back(ImageRequestItem{
      .imageSource = imageSource,
      .surfaceId = surfaceId,
      .imageRequestParams = imageRequestParams,
      .tag = tag});

  auto fabricUIManager_ =
      contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");
  static auto prefetchResources =
      fabricUIManager_->getClass()
          ->getMethod<void(std::string, JReadableMapBuffer::javaobject)>(
              "experimental_prefetchResources");

  auto readableMapBuffer =
      JReadableMapBuffer::createWithContents(serializeImageRequests(items_));
  items_.clear();
  prefetchResources(fabricUIManager_, "RCTImageView", readableMapBuffer.get());

  auto telemetry = std::make_shared<ImageTelemetry>(surfaceId);

  return {imageSource, telemetry};
}

} // namespace facebook::react
