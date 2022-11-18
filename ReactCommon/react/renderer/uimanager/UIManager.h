/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <jsi/jsi.h>

#include <ReactCommon/RuntimeExecutor.h>

#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/StateData.h>
#include <react/renderer/leakchecker/LeakChecker.h>
#include <react/renderer/mounting/ShadowTree.h>
#include <react/renderer/mounting/ShadowTreeDelegate.h>
#include <react/renderer/mounting/ShadowTreeRegistry.h>
#include <react/renderer/uimanager/UIManagerAnimationDelegate.h>
#include <react/renderer/uimanager/UIManagerDelegate.h>
#include <react/renderer/uimanager/primitives.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

class UIManagerBinding;
class UIManagerCommitHook;

class UIManager final : public ShadowTreeDelegate {
 public:
  UIManager(
      RuntimeExecutor const &runtimeExecutor,
      BackgroundExecutor backgroundExecutor,
      ContextContainer::Shared contextContainer);

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

  /**
   * Sets and gets the UIManager's Animation APIs delegate.
   * The delegate is stored as a raw pointer, so the owner must null
   * the pointer before being destroyed.
   */
  void setAnimationDelegate(UIManagerAnimationDelegate *delegate);

  /**
   * Execute stopSurface on any UIMAnagerAnimationDelegate.
   */
  void stopSurfaceForAnimationDelegate(SurfaceId surfaceId) const;

  void animationTick() const;

  /*
   * Provides access to a UIManagerBindging.
   * The `callback` methods will not be called if the internal pointer to
   * `UIManagerBindging` is `nullptr`.
   * The callback is called synchronously on the same thread.
   */
  void visitBinding(
      std::function<void(UIManagerBinding const &uiManagerBinding)> const
          &callback,
      jsi::Runtime &runtime) const;

  /*
   * Registers and unregisters a commit hook.
   */
  void registerCommitHook(UIManagerCommitHook const &commitHook) const;
  void unregisterCommitHook(UIManagerCommitHook const &commitHook) const;

  ShadowNode::Shared getNewestCloneOfShadowNode(
      ShadowNode const &shadowNode) const;

#pragma mark - Surface Start & Stop

  void startSurface(
      ShadowTree::Unique &&shadowTree,
      std::string const &moduleName,
      folly::dynamic const &props,
      DisplayMode displayMode) const;

  void setSurfaceProps(
      SurfaceId surfaceId,
      std::string const &moduleName,
      folly::dynamic const &props,
      DisplayMode displayMode) const;

  ShadowTree::Unique stopSurface(SurfaceId surfaceId) const;

#pragma mark - ShadowTreeDelegate

  void shadowTreeDidFinishTransaction(
      ShadowTree const &shadowTree,
      MountingCoordinator::Shared const &mountingCoordinator) const override;

  RootShadowNode::Unshared shadowTreeWillCommit(
      ShadowTree const &shadowTree,
      RootShadowNode::Shared const &oldRootShadowNode,
      RootShadowNode::Unshared const &newRootShadowNode) const override;

  ShadowNode::Shared createNode(
      Tag tag,
      std::string const &componentName,
      SurfaceId surfaceId,
      const RawProps &props,
      SharedEventTarget eventTarget) const;

  ShadowNode::Shared cloneNode(
      ShadowNode const &shadowNode,
      ShadowNode::SharedListOfShared const &children = nullptr,
      RawProps const *rawProps = nullptr) const;

  void appendChild(
      const ShadowNode::Shared &parentShadowNode,
      const ShadowNode::Shared &childShadowNode) const;

  void completeSurface(
      SurfaceId surfaceId,
      ShadowNode::UnsharedListOfShared const &rootChildren,
      ShadowTree::CommitOptions commitOptions) const;

  void setIsJSResponder(
      ShadowNode::Shared const &shadowNode,
      bool isJSResponder,
      bool blockNativeResponder) const;

  ShadowNode::Shared findNodeAtPoint(
      ShadowNode::Shared const &shadowNode,
      Point point) const;

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
      folly::dynamic const &args) const;

  void sendAccessibilityEvent(
      const ShadowNode::Shared &shadowNode,
      std::string const &eventType);

  ShadowTreeRegistry const &getShadowTreeRegistry() const;

 private:
  friend class UIManagerBinding;
  friend class Scheduler;
  friend class SurfaceHandler;

  /**
   * Configure a LayoutAnimation to happen on the next commit.
   * This API configures a global LayoutAnimation starting from the root node.
   */
  void configureNextLayoutAnimation(
      jsi::Runtime &runtime,
      RawValue const &config,
      jsi::Value const &successCallback,
      jsi::Value const &failureCallback) const;

  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  UIManagerDelegate *delegate_{};
  UIManagerAnimationDelegate *animationDelegate_{nullptr};
  RuntimeExecutor const runtimeExecutor_{};
  ShadowTreeRegistry shadowTreeRegistry_{};
  BackgroundExecutor const backgroundExecutor_{};
  ContextContainer::Shared contextContainer_;

  mutable butter::shared_mutex commitHookMutex_;
  mutable std::vector<UIManagerCommitHook const *> commitHooks_;

  std::unique_ptr<LeakChecker> leakChecker_;
};

} // namespace facebook::react
