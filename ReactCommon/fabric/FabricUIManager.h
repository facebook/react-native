/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <folly/FBVector.h>
#include <memory>

#include <fabric/core/ShadowNode.h>

namespace facebook {
namespace react {

class IFabricPlatformUIOperationManager;

class FabricUIManager {
public:
  FabricUIManager(const std::shared_ptr<IFabricPlatformUIOperationManager> &platformUIOperationManager);

  SharedShadowNode createNode(int reactTag, std::string viewName, int rootTag, folly::dynamic props, void *instanceHandle);
  SharedShadowNode cloneNode(const SharedShadowNode &node);
  SharedShadowNode cloneNodeWithNewChildren(const SharedShadowNode &node);
  SharedShadowNode cloneNodeWithNewProps(const SharedShadowNode &node, folly::dynamic props);
  SharedShadowNode cloneNodeWithNewChildrenAndProps(const SharedShadowNode &node, folly::dynamic newProps);
  void appendChild(const SharedShadowNode &parentNode, const SharedShadowNode &childNode);
  SharedShadowNodeUnsharedList createChildSet(int rootTag);
  void appendChildToSet(const SharedShadowNodeUnsharedList &childSet, const SharedShadowNode &childNode);
  void completeRoot(int rootTag, const SharedShadowNodeUnsharedList &childSet);

private:
  std::shared_ptr<IFabricPlatformUIOperationManager> platformUIOperationManager_;
};

} // namespace react
} // namespace facebook
