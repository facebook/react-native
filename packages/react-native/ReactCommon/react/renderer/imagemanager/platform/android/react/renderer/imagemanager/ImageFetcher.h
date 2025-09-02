/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/imagemanager/ImageRequest.h>
#include <react/renderer/imagemanager/ImageRequestParams.h>
#include <react/renderer/mounting/ShadowTree.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

class ImageFetcher : public UIManagerCommitHook {
 public:
  ImageFetcher(std::shared_ptr<const ContextContainer> contextContainer);
  ~ImageFetcher() override;
  ImageFetcher(const ImageFetcher&) = delete;
  ImageFetcher& operator=(const ImageFetcher&) = delete;
  ImageFetcher(ImageFetcher&&) = delete;
  ImageFetcher& operator=(ImageFetcher&&) = delete;

  ImageRequest requestImage(
      const ImageSource& imageSource,
      SurfaceId surfaceId,
      const ImageRequestParams& imageRequestParams,
      Tag tag);

  void commitHookWasRegistered(const UIManager& uiManager) noexcept override {}

  void commitHookWasUnregistered(const UIManager& uiManager) noexcept override {
  }

  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree& shadowTree,
      const RootShadowNode::Shared& oldRootShadowNode,
      const RootShadowNode::Unshared& newRootShadowNode,
      const ShadowTree::CommitOptions& commitOptions) noexcept override;

 private:
  std::vector<ImageRequestItem> items_;
  std::shared_ptr<const ContextContainer> contextContainer_;
};
} // namespace facebook::react
