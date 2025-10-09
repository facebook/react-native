/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageFetcher.h"

#include <glog/logging.h>
#include <react/common/mapbuffer/JReadableMapBuffer.h>
#include <react/renderer/imagemanager/conversions.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>

namespace facebook::react {

class ImageFetcherCommitHook : public UIManagerCommitHook {
 public:
  explicit ImageFetcherCommitHook(ImageFetcher* fetcher) : fetcher_(fetcher) {}

  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree& /*shadowTree*/,
      const RootShadowNode::Shared& /*oldRootShadowNode*/,
      const RootShadowNode::Unshared& newRootShadowNode,
      const ShadowTree::CommitOptions& /*commitOptions*/) noexcept override {
    if (fetcher_ != nullptr) {
      fetcher_->flushImageRequests();
    }
    return newRootShadowNode;
  }

  void commitHookWasRegistered(
      const UIManager& /*uiManager*/) noexcept override {}

  void commitHookWasUnregistered(
      const UIManager& /*uiManager*/) noexcept override {}

  void invalidate() {
    fetcher_ = nullptr;
  }

 private:
  ImageFetcher* fetcher_;
};

ImageFetcher::ImageFetcher(
    std::shared_ptr<const ContextContainer> contextContainer)
    : contextContainer_(std::move(contextContainer)) {
  if (ReactNativeFeatureFlags::enableImagePrefetchingJNIBatchingAndroid()) {
    if (auto uiManagerCommitHookManager =
            contextContainer_
                ->find<std::shared_ptr<UIManagerCommitHookManager>>(
                    std::string(UIManagerCommitHookManagerKey));
        uiManagerCommitHookManager.has_value()) {
      commitHook_ = std::make_unique<ImageFetcherCommitHook>(this);
      (*uiManagerCommitHookManager)->registerCommitHook(*commitHook_);
    }
  }
}

ImageFetcher::~ImageFetcher() {
  if (ReactNativeFeatureFlags::enableImagePrefetchingJNIBatchingAndroid() &&
      commitHook_ != nullptr) {
    commitHook_->invalidate();
    if (auto uiManagerCommitHookManager =
            contextContainer_
                ->find<std::shared_ptr<UIManagerCommitHookManager>>(
                    std::string(UIManagerCommitHookManagerKey));
        uiManagerCommitHookManager.has_value()) {
      (*uiManagerCommitHookManager)->unregisterCommitHook(*commitHook_);
    }
    commitHook_ = nullptr;
  }
}

ImageRequest ImageFetcher::requestImage(
    const ImageSource& imageSource,
    SurfaceId surfaceId,
    const ImageRequestParams& imageRequestParams,
    Tag tag) {
  items_[surfaceId].emplace_back(ImageRequestItem{
      .imageSource = imageSource,
      .imageRequestParams = imageRequestParams,
      .tag = tag});

  auto telemetry = std::make_shared<ImageTelemetry>(surfaceId);

  if (!ReactNativeFeatureFlags::enableImagePrefetchingJNIBatchingAndroid()) {
    flushImageRequests();
  }

  return {imageSource, telemetry};
}

void ImageFetcher::flushImageRequests() {
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

} // namespace facebook::react
