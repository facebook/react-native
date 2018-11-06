/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <folly/dynamic.h>
#include <jsi/jsi.h>

#include <fabric/core/ShadowNode.h>
#include <fabric/events/EventBeatBasedExecutor.h>
#include <fabric/uimanager/ComponentDescriptorRegistry.h>
#include <fabric/uimanager/UIManagerDelegate.h>

namespace facebook {
namespace react {

class FabricUIManager;
using UIManager = FabricUIManager;

using RuntimeExecutor = std::function<void(
    std::function<void(facebook::jsi::Runtime &runtime)> &&callback)>;

/*
 * Particular implementations of those functions should capture references to
 * the runtime and ensure proper threading.
 */
using UIManagerInstaller = void(UIManager &uiManager);
using UIManagerUninstaller = void();

using DispatchEventToEmptyTargetFunction = void(
    const EventHandler &eventHandler,
    const std::string &type,
    const folly::dynamic &payload);
using DispatchEventToTargetFunction = void(
    const EventHandler &eventHandler,
    const EventTarget &eventTarget,
    const std::string &type,
    const folly::dynamic &payload);

using StartSurface = void(
    SurfaceId surfaceId,
    const std::string &moduleName,
    const folly::dynamic &initalProps);
using StopSurface = void(SurfaceId surfaceId);

class FabricUIManager {
 public:
  FabricUIManager(
      std::unique_ptr<EventBeatBasedExecutor> executor,
      std::function<UIManagerInstaller> installer,
      std::function<UIManagerUninstaller> uninstaller);
  ~FabricUIManager();

#pragma mark - Native-facing Interface

  void setComponentDescriptorRegistry(
      const SharedComponentDescriptorRegistry &componentDescriptorRegistry);

  /*
   * Sets and gets the UIManager's delegate.
   * The delegate is stored as a raw pointer, so the owner must null
   * the pointer before being destroyed.
   */
  void setDelegate(UIManagerDelegate *delegate);
  UIManagerDelegate *getDelegate();

#pragma mark - Callback Functions

  /*
   * Registers callback functions.
   */
  void setDispatchEventToEmptyTargetFunction(
      std::function<DispatchEventToEmptyTargetFunction> dispatchEventFunction);
  void setDispatchEventToTargetFunction(
      std::function<DispatchEventToTargetFunction> dispatchEventFunction);
  void setStartSurfaceFunction(std::function<StartSurface>);
  void setStopSurfaceFunction(std::function<StopSurface>);

#pragma mark - Native-facing Interface

  void dispatchEventToTarget(
      jsi::Runtime &runtime,
      const EventTarget *eventTarget,
      const std::string &type,
      const folly::dynamic &payload) const;
  void startSurface(
      SurfaceId surfaceId,
      const std::string &moduleName,
      const folly::dynamic &initialProps) const;
  void stopSurface(SurfaceId surfaceId) const;

#pragma mark - JavaScript/React-facing Interface

  /*
   * All those JavaScript-facing methods call be called from any thread.
   * `UIManager` guarantees its own thread-safety, but it does *not* guarantee
   * thread-safety of `ShadowNode`s that it operates on. The caller should
   * enforce logical correctness and thread-safety of the unsealed
   * `ShadowNode`s.
   */
  SharedShadowNode createNode(
      Tag reactTag,
      std::string viewName,
      Tag rootTag,
      folly::dynamic props,
      SharedEventTarget eventTarget) const;
  SharedShadowNode cloneNode(const SharedShadowNode &node) const;
  SharedShadowNode cloneNodeWithNewChildren(const SharedShadowNode &node) const;
  SharedShadowNode cloneNodeWithNewProps(
      const SharedShadowNode &node,
      folly::dynamic props) const;
  SharedShadowNode cloneNodeWithNewChildrenAndProps(
      const SharedShadowNode &node,
      folly::dynamic newProps) const;
  void appendChild(
      const SharedShadowNode &parentNode,
      const SharedShadowNode &childNode) const;
  SharedShadowNodeUnsharedList createChildSet(Tag rootTag) const;
  void appendChildToSet(
      const SharedShadowNodeUnsharedList &childSet,
      const SharedShadowNode &childNode) const;
  void completeRoot(Tag rootTag, const SharedShadowNodeUnsharedList &childSet)
      const;
  void registerEventHandler(UniqueEventHandler eventHandler) const;

 private:
  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  UIManagerDelegate *delegate_;
  mutable UniqueEventHandler eventHandler_;
  std::function<DispatchEventToEmptyTargetFunction>
      dispatchEventToEmptyTargetFunction_;
  std::function<DispatchEventToTargetFunction> dispatchEventToTargetFunction_;
  std::function<StartSurface> startSurfaceFunction_;
  std::function<StopSurface> stopSurfaceFunction_;

  std::unique_ptr<EventBeatBasedExecutor> executor_;
  std::function<UIManagerInstaller> installer_;
  std::function<UIManagerUninstaller> uninstaller_;
};

} // namespace react
} // namespace facebook
