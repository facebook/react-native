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

namespace facebook {
namespace react {

class ShadowNode;
class IFabricPlatformUIOperationManager;

typedef std::shared_ptr<const ShadowNode> ShadowNodeRef;
typedef folly::fbvector<const ShadowNodeRef> ShadowNodeSet;
typedef std::shared_ptr<const ShadowNodeSet> ShadowNodeSetRef;

class FabricUIManager {
public:
  FabricUIManager(const std::shared_ptr<IFabricPlatformUIOperationManager> &platformUIOperationManager);

  ShadowNodeRef createNode(int reactTag, std::string viewName, int rootTag, folly::dynamic props, void *instanceHandle);
  ShadowNodeRef cloneNode(const ShadowNodeRef &node);
  ShadowNodeRef cloneNodeWithNewChildren(const ShadowNodeRef &node);
  ShadowNodeRef cloneNodeWithNewProps(const ShadowNodeRef &node, folly::dynamic props);
  ShadowNodeRef cloneNodeWithNewChildrenAndProps(const ShadowNodeRef &node, folly::dynamic newProps);
  void appendChild(const ShadowNodeRef &parentNode, const ShadowNodeRef &childNode);
  ShadowNodeSetRef createChildSet(int rootTag);
  void appendChildToSet(const ShadowNodeSetRef &childSet, const ShadowNodeRef &childNode);
  void completeRoot(int rootTag, const ShadowNodeSetRef &childSet);

private:
  std::shared_ptr<IFabricPlatformUIOperationManager> platformUIOperationManager_;
};

} // namespace react
} // namespace facebook
