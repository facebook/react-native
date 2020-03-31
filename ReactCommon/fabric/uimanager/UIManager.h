/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Optional.h>
#include <folly/dynamic.h>
#include <jsi/jsi.h>

#include <react/core/ShadowNode.h>
#include <react/core/StateData.h>
#include <react/mounting/ShadowTree.h>
#include <react/mounting/ShadowTreeDelegate.h>
#include <react/mounting/ShadowTreeRegistry.h>
#include <react/uimanager/ComponentDescriptorRegistry.h>
#include <react/uimanager/UIManagerDelegate.h>

namespace facebook {
namespace react {

class UIManagerBinding;

class UIManager final : public ShadowTreeDelegate {
 public:
  ~UIManager();

  void setComponentDescriptorRegistry(
      const SharedComponentDescriptorRegistry &componentDescriptorRegistry);

  /*
   * Sets and gets the UIManager's delegate.
   * The delegate is stored as a raw pointer, so the owner must null
   * the pointer before being destroyed.
   */
  void setDelegate(UIManagerDelegate *delegate);
  UIManagerDelegate *getDelegate();

  /*
   * Provides access to a UIManagerBindging.
   * The `callback` methods will not be called if the internal pointer to
   * `UIManagerBindging` is `nullptr`.
   * The callback is called synchronously on the same thread.
   */
  void visitBinding(
      std::function<void(UIManagerBinding const &uiManagerBinding)> callback)
      const;

#pragma mark - ShadowTreeDelegate

  void shadowTreeDidFinishTransaction(
      ShadowTree const &shadowTree,
      MountingCoordinator::Shared const &mountingCoordinator) const override;

 private:
  friend class UIManagerBinding;
  friend class Scheduler;

  ShadowNode::Shared createNode(
      Tag tag,
      std::string const &componentName,
      SurfaceId surfaceId,
      const RawProps &props,
      SharedEventTarget eventTarget) const;

  ShadowNode::Shared cloneNode(
      const ShadowNode::Shared &shadowNode,
      const SharedShadowNodeSharedList &children = nullptr,
      const RawProps *rawProps = nullptr) const;

  void appendChild(
      const ShadowNode::Shared &parentShadowNode,
      const ShadowNode::Shared &childShadowNode) const;

  void completeSurface(
      SurfaceId surfaceId,
      const SharedShadowNodeUnsharedList &rootChildren) const;

  void setNativeProps(ShadowNode const &shadowNode, RawProps const &rawProps)
      const;

  void setJSResponder(
      const ShadowNode::Shared &shadowNode,
      const bool blockNativeResponder) const;

  void clearJSResponder() const;

  ShadowNode::Shared findNodeAtPoint(
      ShadowNode::Shared const &shadowNode,
      Point point) const;

  ShadowNode::Shared const *getNewestCloneOfShadowNode(
      ShadowNode::Shared const &shadowNode) const;

  /*
   * Returns layout metrics of given `shadowNode` relative to
   * `ancestorShadowNode` (relative to the root node in case if provided
   * `ancestorShadowNode` is nullptr).
   */
  LayoutMetrics getRelativeLayoutMetrics(
      ShadowNode const &shadowNode,
      ShadowNode const *ancestorShadowNode,
      LayoutableShadowNode::LayoutInspectingPolicy policy) const;

  /*
   * Creates a new shadow node with given state data, clones what's necessary
   * and performs a commit.
   */
  void updateState(StateUpdate const &stateUpdate) const;

  void dispatchCommand(
      const ShadowNode::Shared &shadowNode,
      std::string const &commandName,
      folly::dynamic const args) const;

  ShadowTreeRegistry const &getShadowTreeRegistry() const;

  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  UIManagerDelegate *delegate_;
  UIManagerBinding *uiManagerBinding_;
  ShadowTreeRegistry shadowTreeRegistry_{};
};

} // namespace react
} // namespace facebook
