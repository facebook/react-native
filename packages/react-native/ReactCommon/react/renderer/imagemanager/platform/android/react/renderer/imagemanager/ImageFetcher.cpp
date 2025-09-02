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

namespace facebook::react {

ImageFetcher::ImageFetcher(
    std::shared_ptr<const ContextContainer> contextContainer)
    : contextContainer_(std::move(contextContainer)) {
  if (contextContainer_ != nullptr) {
    if (auto uiManagerCommitHookManager =
            contextContainer_
                ->find<std::shared_ptr<UIManagerCommitHookManager>>(
                    std::string(UIManagerCommitHookManagerKey));
        uiManagerCommitHookManager.has_value()) {
      (*uiManagerCommitHookManager)->registerCommitHook(*this);
    }
  }
}

ImageFetcher::~ImageFetcher() {
  if (contextContainer_ != nullptr) {
    if (auto uiManagerCommitHookManager =
            contextContainer_
                ->find<std::shared_ptr<UIManagerCommitHookManager>>(
                    std::string(UIManagerCommitHookManagerKey));
        uiManagerCommitHookManager.has_value()) {
      (*uiManagerCommitHookManager)->unregisterCommitHook(*this);
    }
  }
}

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

  auto telemetry = std::make_shared<ImageTelemetry>(surfaceId);

  return {imageSource, telemetry};
}

RootShadowNode::Unshared ImageFetcher::shadowTreeWillCommit(
    const ShadowTree& /*shadowTree*/,
    const RootShadowNode::Shared& /*oldRootShadowNode*/,
    const RootShadowNode::Unshared& newRootShadowNode,
    const ShadowTree::CommitOptions& /*commitOptions*/) noexcept {
  if (items_.empty()) {
    return newRootShadowNode;
  }

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

  return newRootShadowNode;
}

} // namespace facebook::react
