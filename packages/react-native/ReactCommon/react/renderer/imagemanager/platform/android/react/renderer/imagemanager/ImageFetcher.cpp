/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageFetcher.h"

#include <react/common/mapbuffer/JReadableMapBuffer.h>
#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/imagemanager/conversions.h>

namespace facebook::react {

extern const char ImageFetcherKey[] = "ImageFetcher";

ImageFetcher::ImageFetcher(
    std::shared_ptr<const ContextContainer> contextContainer)
    : contextContainer_(std::move(contextContainer))
#ifdef REACT_NATIVE_DEBUG
      ,
      threadId_(std::this_thread::get_id())
#endif
{
}

ImageRequest ImageFetcher::requestImage(
    const ImageSource& imageSource,
    SurfaceId surfaceId,
    const ImageRequestParams& imageRequestParams,
    Tag tag) {
  items_[surfaceId].emplace_back(
      ImageRequestItem{
          .imageSource = imageSource,
          .imageRequestParams = imageRequestParams,
          .tag = tag});

  auto telemetry = std::make_shared<ImageTelemetry>(surfaceId);

  if (!ReactNativeFeatureFlags::enableImagePrefetchingJNIBatchingAndroid()) {
    flushImageRequests();
  }

  return ImageRequest{imageSource, telemetry};
}

void ImageFetcher::flushImageRequests() {
#ifdef REACT_NATIVE_DEBUG
  if (ReactNativeFeatureFlags::enableImagePrefetchingJNIBatchingAndroid()) {
    assertThread();
  }
#endif

  if (items_.empty()) {
    return;
  }

  auto fabricUIManager_ =
      contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");
  static auto prefetchResources =
      fabricUIManager_->getClass()
          ->getMethod<void(
              SurfaceId, std::string, JReadableMapBuffer::javaobject)>(
              "experimental_prefetchResources");

  for (auto& [surfaceId, surfaceImageRequests] : items_) {
    auto readableMapBuffer = JReadableMapBuffer::createWithContents(
        serializeImageRequests(surfaceImageRequests));
    prefetchResources(
        fabricUIManager_, surfaceId, "RCTImageView", readableMapBuffer.get());
  }

  items_.clear();
}

#ifdef REACT_NATIVE_DEBUG
void ImageFetcher::assertThread() const {
  react_native_assert(
      threadId_ != std::this_thread::get_id() &&
      "ImageFetcher method called from the wrong thread!");
}
#endif

} // namespace facebook::react
