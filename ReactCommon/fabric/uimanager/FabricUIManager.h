/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <folly/dynamic.h>

#include <fabric/core/ShadowNode.h>
#include <fabric/uimanager/ComponentDescriptorRegistry.h>
#include <fabric/uimanager/UIManagerDelegate.h>

namespace facebook {
namespace react {

using DispatchEventToEmptyTargetFunction = void (EventHandler eventHandler, std::string type, folly::dynamic payload);
using DispatchEventToTargetFunction = void (EventHandler eventHandler, EventTarget eventTarget, std::string type, folly::dynamic payload);
using ReleaseEventHandlerFunction = void (EventHandler eventHandler);
using ReleaseEventTargetFunction = void (EventTarget eventTarget);

class FabricUIManager {
public:

#pragma mark - Native-facing Interface

  FabricUIManager(SharedComponentDescriptorRegistry componentDescriptorRegistry);
  ~FabricUIManager();

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
  void setDispatchEventToEmptyTargetFunction(std::function<DispatchEventToEmptyTargetFunction> dispatchEventFunction);
  void setDispatchEventToTargetFunction(std::function<DispatchEventToTargetFunction> dispatchEventFunction);
  void setReleaseEventHandlerFunction(std::function<ReleaseEventHandlerFunction> releaseEventHandlerFunction);
  void setReleaseEventTargetFunction(std::function<ReleaseEventTargetFunction> releaseEventTargetFunction);

#pragma mark - Native-facing Interface

  void dispatchEventToEmptyTarget(const std::string &type, const folly::dynamic &payload) const;
  void dispatchEventToTarget(const EventTarget &eventTarget, const std::string &type, const folly::dynamic &payload) const;
  void releaseEventTarget(const EventTarget &eventTarget) const;

#pragma mark - JavaScript/React-facing Interface

  SharedShadowNode createNode(Tag reactTag, std::string viewName, Tag rootTag, folly::dynamic props, EventTarget eventTarget);
  SharedShadowNode cloneNode(const SharedShadowNode &node);
  SharedShadowNode cloneNodeWithNewChildren(const SharedShadowNode &node);
  SharedShadowNode cloneNodeWithNewProps(const SharedShadowNode &node, folly::dynamic props);
  SharedShadowNode cloneNodeWithNewChildrenAndProps(const SharedShadowNode &node, folly::dynamic newProps);
  void appendChild(const SharedShadowNode &parentNode, const SharedShadowNode &childNode);
  SharedShadowNodeUnsharedList createChildSet(Tag rootTag);
  void appendChildToSet(const SharedShadowNodeUnsharedList &childSet, const SharedShadowNode &childNode);
  void completeRoot(Tag rootTag, const SharedShadowNodeUnsharedList &childSet);
  void registerEventHandler(const EventHandler &eventHandler);

private:

  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  UIManagerDelegate *delegate_;
  EventHandler eventHandler_;
  std::function<DispatchEventToEmptyTargetFunction> dispatchEventToEmptyTargetFunction_;
  std::function<DispatchEventToTargetFunction> dispatchEventToTargetFunction_;
  std::function<ReleaseEventHandlerFunction> releaseEventHandlerFunction_;
  std::function<ReleaseEventTargetFunction> releaseEventTargetFunction_;
};

} // namespace react
} // namespace facebook
