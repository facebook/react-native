/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageFetcher.h"

#include <react/common/mapbuffer/JReadableMapBuffer.h>
#include <react/renderer/imagemanager/conversions.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerBinding.h>

namespace facebook::react {

using RunOnUIManagerFn = std::function<void(UIManager&, ImageFetcher&)>;

namespace {

void runOnUIManager(
    const ContextContainer& contextContainer,
    std::shared_ptr<ImageFetcher> strongThis,
    RunOnUIManagerFn&& runOnUIManagerFn) {
  auto weakRuntimeScheduler =
      contextContainer.find<std::weak_ptr<RuntimeScheduler>>(
          RuntimeSchedulerKey);
  auto runtimeScheduler = weakRuntimeScheduler.has_value()
      ? weakRuntimeScheduler.value().lock()
      : nullptr;
  if (runtimeScheduler == nullptr) {
    return;
  }
  runtimeScheduler->scheduleTask(
      SchedulerPriority::NormalPriority,
      [strongThis,
       runOnUIManagerFn = std::move(runOnUIManagerFn)](jsi::Runtime& runtime) {
        runOnUIManagerFn(
            UIManagerBinding::getBinding(runtime)->getUIManager(), *strongThis);
      });
}

} // namespace

ImageFetcher::ImageFetcher(
    std::shared_ptr<const ContextContainer> contextContainer)
    : contextContainer_(std::move(contextContainer)) {}

ImageFetcher::~ImageFetcher() {
  if (!commitHookRegistered_) {
    return;
  }
  commitHookRegistered_ = false;
  runOnUIManager(
      *contextContainer_,
      shared_from_this(),
      [](UIManager& uiManager, ImageFetcher& strongThis) {
        uiManager.unregisterCommitHook(strongThis);
      });
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

  if (ReactNativeFeatureFlags::enableImagePrefetchingJNIBatchingAndroid()) {
    if (!commitHookRegistered_) {
      runOnUIManager(
          *contextContainer_,
          shared_from_this(),
          [](UIManager& uiManager, ImageFetcher& strongThis) {
            uiManager.registerCommitHook(strongThis);
          });
      commitHookRegistered_ = true;
    }
  } else {
    flushImageRequests();
  }

  return {imageSource, telemetry};
}

RootShadowNode::Unshared ImageFetcher::shadowTreeWillCommit(
    const ShadowTree& /*shadowTree*/,
    const RootShadowNode::Shared& /*oldRootShadowNode*/,
    const RootShadowNode::Unshared& newRootShadowNode,
    const ShadowTree::CommitOptions& /*commitOptions*/) noexcept {
  if (commitHookRegistered_) {
    flushImageRequests();
  }
  return newRootShadowNode;
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
