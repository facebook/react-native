/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

using DispatchEventToEmptyTargetFunction = void (const EventHandler &eventHandler, std::string type, folly::dynamic payload);
using DispatchEventToTargetFunction = void (const EventHandler &eventHandler, const EventTarget &eventTarget, std::string type, folly::dynamic payload);
using ReleaseEventTargetFunction = void (EventTarget eventTarget);

class FabricUIManager {
public:

#pragma mark - Native-facing Interface

  void setComponentDescriptorRegistry(const SharedComponentDescriptorRegistry &componentDescriptorRegistry);

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

#pragma mark - Native-facing Interface

  void dispatchEventToTarget(const EventTarget *eventTarget, const std::string &type, const folly::dynamic &payload) const;

#pragma mark - JavaScript/React-facing Interface

  SharedShadowNode createNode(Tag reactTag, std::string viewName, Tag rootTag, folly::dynamic props, SharedEventTarget eventTarget);
  SharedShadowNode cloneNode(const SharedShadowNode &node);
  SharedShadowNode cloneNodeWithNewChildren(const SharedShadowNode &node);
  SharedShadowNode cloneNodeWithNewProps(const SharedShadowNode &node, folly::dynamic props);
  SharedShadowNode cloneNodeWithNewChildrenAndProps(const SharedShadowNode &node, folly::dynamic newProps);
  void appendChild(const SharedShadowNode &parentNode, const SharedShadowNode &childNode);
  SharedShadowNodeUnsharedList createChildSet(Tag rootTag);
  void appendChildToSet(const SharedShadowNodeUnsharedList &childSet, const SharedShadowNode &childNode);
  void completeRoot(Tag rootTag, const SharedShadowNodeUnsharedList &childSet);
  void registerEventHandler(UniqueEventHandler eventHandler);

private:

  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  UIManagerDelegate *delegate_;
  UniqueEventHandler eventHandler_;
  std::function<DispatchEventToEmptyTargetFunction> dispatchEventToEmptyTargetFunction_;
  std::function<DispatchEventToTargetFunction> dispatchEventToTargetFunction_;
};

} // namespace react
} // namespace facebook
