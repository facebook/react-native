/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerDelegate.h>

namespace facebook::react {

class FantomPromotedRevisionMergeProxyUIManagerDelegate final : public UIManagerDelegate {
 public:
  void setUIManager(UIManager &uiManager);
  bool hasDelegate() const;
  void preventNextPromotedRevisionMerge();
  void mergePromotedRevision();

  void uiManagerDidFinishTransaction(
      std::shared_ptr<const MountingCoordinator> mountingCoordinator,
      bool mountSynchronously) override;
  void uiManagerDidCreateShadowNode(const ShadowNode &shadowNode) override;
  void uiManagerDidDispatchCommand(
      const std::shared_ptr<const ShadowNode> &shadowNode,
      const std::string &commandName,
      const folly::dynamic &args) override;
  void uiManagerDidSendAccessibilityEvent(
      const std::shared_ptr<const ShadowNode> &shadowNode,
      const std::string &eventType) override;
  void uiManagerDidSetIsJSResponder(
      const std::shared_ptr<const ShadowNode> &shadowNode,
      bool isJSResponder,
      bool blockNativeResponder) override;
  void uiManagerShouldSynchronouslyUpdateViewOnUIThread(Tag tag, const folly::dynamic &props) override;
  void uiManagerDidUpdateShadowTree(const std::unordered_map<Tag, folly::dynamic> &tagToProps) override;
  void uiManagerShouldAddEventListener(std::shared_ptr<const EventListener> listener) final;
  void uiManagerShouldRemoveEventListener(const std::shared_ptr<const EventListener> &listener) final;
  void uiManagerDidFinishReactCommit(const ShadowTree &shadowTree) override;
  void uiManagerDidPromoteReactRevision(const ShadowTree &shadowTree) override;
  void uiManagerDidStartSurface(const ShadowTree &shadowTree) override;
  void uiManagerShouldSetOnSurfaceStartCallback(OnSurfaceStartCallback &&callback) override;

 private:
  UIManager *uiManager_{};
  UIManagerDelegate *delegateImpl_{};
  bool skipNextPromotedRevisionMerge_ = false;
};

} // namespace facebook::react
