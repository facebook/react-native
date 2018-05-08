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

class FabricUIManager {
public:

#pragma mark - Native-facing Interface

  FabricUIManager(SharedComponentDescriptorRegistry componentDescriptorRegistry);

  /*
   * Sets and gets the UIManager's delegate.
   * The delegate is stored as a raw pointer, so the owner must null
   * the pointer before being destroyed.
   */
  void setDelegate(UIManagerDelegate *delegate);
  UIManagerDelegate *getDelegate();

#pragma mark - JavaScript/React-facing Interface

  SharedShadowNode createNode(Tag reactTag, std::string viewName, Tag rootTag, folly::dynamic props, void *instanceHandle);
  SharedShadowNode cloneNode(const SharedShadowNode &node);
  SharedShadowNode cloneNodeWithNewChildren(const SharedShadowNode &node);
  SharedShadowNode cloneNodeWithNewProps(const SharedShadowNode &node, folly::dynamic props);
  SharedShadowNode cloneNodeWithNewChildrenAndProps(const SharedShadowNode &node, folly::dynamic newProps);
  void appendChild(const SharedShadowNode &parentNode, const SharedShadowNode &childNode);
  SharedShadowNodeUnsharedList createChildSet(Tag rootTag);
  void appendChildToSet(const SharedShadowNodeUnsharedList &childSet, const SharedShadowNode &childNode);
  void completeRoot(Tag rootTag, const SharedShadowNodeUnsharedList &childSet);

private:
  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  UIManagerDelegate *delegate_;
};

} // namespace react
} // namespace facebook
