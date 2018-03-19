/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FabricUIManager.h"

#include "IFabricPlatformUIOperationManager.h"

namespace facebook {
namespace react {

FabricUIManager::FabricUIManager(const std::shared_ptr<IFabricPlatformUIOperationManager> &platformUIOperationManager) :
  platformUIOperationManager_(platformUIOperationManager) {};

SharedShadowNode FabricUIManager::createNode(int reactTag, std::string viewName, int rootTag, folly::dynamic props, void *instanceHandle) {
  platformUIOperationManager_->performUIOperation();
  return nullptr;
}

SharedShadowNode FabricUIManager::cloneNode(const SharedShadowNode &node) {
  return nullptr;
}

SharedShadowNode FabricUIManager::cloneNodeWithNewChildren(const SharedShadowNode &node) {
  return nullptr;
}

SharedShadowNode FabricUIManager::cloneNodeWithNewProps(const SharedShadowNode &node, folly::dynamic props) {
  return nullptr;
}

SharedShadowNode FabricUIManager::cloneNodeWithNewChildrenAndProps(const SharedShadowNode &node, folly::dynamic newProps) {
  return nullptr;
}

void FabricUIManager::appendChild(const SharedShadowNode &parentNode, const SharedShadowNode &childNode) {
}

SharedShadowNodeUnsharedList FabricUIManager::createChildSet(int rootTag) {
  return nullptr;
}

void FabricUIManager::appendChildToSet(const SharedShadowNodeUnsharedList &childSet, const SharedShadowNode &childNode) {
}

void FabricUIManager::completeRoot(int rootTag, const SharedShadowNodeUnsharedList &childSet) {
}

} // namespace react
} // namespace facebook
