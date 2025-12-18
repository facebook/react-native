/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>

namespace facebook::react {

class SurfaceHandler;

class SurfaceHandlerCommitHook : public UIManagerCommitHook {
 public:
  SurfaceHandlerCommitHook(SurfaceId surfaceId);
  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree &shadowTree,
      const RootShadowNode::Shared &oldRootShadowNode,
      const RootShadowNode::Unshared &newRootShadowNode,
      const ShadowTreeCommitOptions &commitOptions) noexcept override;
  void commitHookWasRegistered(const UIManager &uiManager) noexcept override {}
  void commitHookWasUnregistered(const UIManager &uiManager) noexcept override {}

  /*
   * An utility for dirtying all measurable shadow nodes present in the tree.
   */
  void dirtyMeasurableNodes(ShadowNode &root) const;
  std::shared_ptr<const ShadowNode> dirtyMeasurableNodesRecursive(std::shared_ptr<const ShadowNode> node) const;

  void setContextContainer(std::shared_ptr<const ContextContainer> contextContainer);

  void setLayoutConstraints(const LayoutConstraints &layoutConstraints, const LayoutContext &layoutContext);

  void setSurfaceId(SurfaceId surfaceId);

 private:
  SurfaceId surfaceId_{};
  std::shared_ptr<const ContextContainer> contextContainer_{};

  mutable std::shared_mutex mutex_;
  std::optional<LayoutConstraints> layoutConstraints_{};
  std::optional<LayoutContext> layoutContext_{};
};

} // namespace facebook::react
