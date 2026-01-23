/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FantomPromotedRevisionMergeProxyUIManagerDelegate.h"

namespace facebook::react {

void FantomPromotedRevisionMergeProxyUIManagerDelegate::setUIManager(
    UIManager& uiManager) {
  uiManager_ = &uiManager;
  delegateImpl_ = uiManager.getDelegate();
}

bool FantomPromotedRevisionMergeProxyUIManagerDelegate::hasDelegate() const {
  return delegateImpl_ != nullptr;
}

void FantomPromotedRevisionMergeProxyUIManagerDelegate::
    preventNextPromotedRevisionMerge() {
  skipNextPromotedRevisionMerge_ = true;
}

void FantomPromotedRevisionMergeProxyUIManagerDelegate::
    mergePromotedRevision() {
  uiManager_->getShadowTreeRegistry().enumerate(
      [&](const ShadowTree& shadowTree, bool&) {
        uiManager_->shadowTreeDidPromoteReactRevision(shadowTree);
      });
}

void FantomPromotedRevisionMergeProxyUIManagerDelegate::
    uiManagerDidFinishTransaction(
        std::shared_ptr<const MountingCoordinator> mountingCoordinator,
        bool mountSynchronously) {
  delegateImpl_->uiManagerDidFinishTransaction(
      std::move(mountingCoordinator), mountSynchronously);
}

void FantomPromotedRevisionMergeProxyUIManagerDelegate::
    uiManagerDidCreateShadowNode(const ShadowNode& shadowNode) {
  delegateImpl_->uiManagerDidCreateShadowNode(shadowNode);
}

void FantomPromotedRevisionMergeProxyUIManagerDelegate::
    uiManagerDidDispatchCommand(
        const std::shared_ptr<const ShadowNode>& shadowNode,
        const std::string& commandName,
        const folly::dynamic& args) {
  delegateImpl_->uiManagerDidDispatchCommand(shadowNode, commandName, args);
}

void FantomPromotedRevisionMergeProxyUIManagerDelegate::
    uiManagerDidSendAccessibilityEvent(
        const std::shared_ptr<const ShadowNode>& shadowNode,
        const std::string& eventType) {
  delegateImpl_->uiManagerDidSendAccessibilityEvent(shadowNode, eventType);
}

void FantomPromotedRevisionMergeProxyUIManagerDelegate::
    uiManagerDidSetIsJSResponder(
        const std::shared_ptr<const ShadowNode>& shadowNode,
        bool isJSResponder,
        bool blockNativeResponder) {
  delegateImpl_->uiManagerDidSetIsJSResponder(
      shadowNode, isJSResponder, blockNativeResponder);
}

void FantomPromotedRevisionMergeProxyUIManagerDelegate::
    uiManagerShouldSynchronouslyUpdateViewOnUIThread(
        Tag tag,
        const folly::dynamic& props) {
  delegateImpl_->uiManagerShouldSynchronouslyUpdateViewOnUIThread(tag, props);
}

void FantomPromotedRevisionMergeProxyUIManagerDelegate::
    uiManagerDidUpdateShadowTree(
        const std::unordered_map<Tag, folly::dynamic>& tagToProps) {
  delegateImpl_->uiManagerDidUpdateShadowTree(tagToProps);
}

void FantomPromotedRevisionMergeProxyUIManagerDelegate::
    uiManagerShouldAddEventListener(
        std::shared_ptr<const EventListener> listener) {
  delegateImpl_->uiManagerShouldAddEventListener(std::move(listener));
}

void FantomPromotedRevisionMergeProxyUIManagerDelegate::
    uiManagerShouldRemoveEventListener(
        const std::shared_ptr<const EventListener>& listener) {
  delegateImpl_->uiManagerShouldRemoveEventListener(listener);
}

void FantomPromotedRevisionMergeProxyUIManagerDelegate::
    uiManagerDidFinishReactCommit(const ShadowTree& shadowTree) {
  delegateImpl_->uiManagerDidFinishReactCommit(shadowTree);
}

void FantomPromotedRevisionMergeProxyUIManagerDelegate::
    uiManagerDidPromoteReactRevision(const ShadowTree& shadowTree) {
  if (this->skipNextPromotedRevisionMerge_) {
    this->skipNextPromotedRevisionMerge_ = false;
    return;
  }
  delegateImpl_->uiManagerDidPromoteReactRevision(shadowTree);
}

void FantomPromotedRevisionMergeProxyUIManagerDelegate::
    uiManagerDidStartSurface(const ShadowTree& shadowTree) {
  delegateImpl_->uiManagerDidStartSurface(shadowTree);
}

void FantomPromotedRevisionMergeProxyUIManagerDelegate::
    uiManagerShouldSetOnSurfaceStartCallback(
        OnSurfaceStartCallback&& callback) {
  delegateImpl_->uiManagerShouldSetOnSurfaceStartCallback(std::move(callback));
}

} // namespace facebook::react
