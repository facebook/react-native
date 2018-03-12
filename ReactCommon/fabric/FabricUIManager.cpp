/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FabricUIManager.h"

#include "IFabricPlatformUIOperationManager.h"
#include "ShadowNode.h"

namespace facebook {
namespace react {

FabricUIManager::FabricUIManager(const std::shared_ptr<IFabricPlatformUIOperationManager> &platformUIOperationManager) :
  platformUIOperationManager_(platformUIOperationManager) {};

ShadowNodeRef FabricUIManager::createNode(int reactTag, std::string viewName, int rootTag, folly::dynamic props, void *instanceHandle) {
  platformUIOperationManager_->performUIOperation();
  return std::make_shared<ShadowNode>(reactTag, viewName, rootTag, props, instanceHandle);
}

ShadowNodeRef FabricUIManager::cloneNode(const ShadowNodeRef &node) {
  return nullptr;
}

ShadowNodeRef FabricUIManager::cloneNodeWithNewChildren(const ShadowNodeRef &node) {
  return nullptr;
}

ShadowNodeRef FabricUIManager::cloneNodeWithNewProps(const ShadowNodeRef &node, folly::dynamic props) {
  return nullptr;
}

ShadowNodeRef FabricUIManager::cloneNodeWithNewChildrenAndProps(const ShadowNodeRef &node, folly::dynamic newProps) {
  return nullptr;
}

void FabricUIManager::appendChild(const ShadowNodeRef &parentNode, const ShadowNodeRef &childNode) {
}

ShadowNodeSetRef FabricUIManager::createChildSet(int rootTag) {
  return nullptr;
}

void FabricUIManager::appendChildToSet(const ShadowNodeSetRef &childSet, const ShadowNodeRef &childNode) {
}

void FabricUIManager::completeRoot(int rootTag, const ShadowNodeSetRef &childSet) {
}

} // namespace react
} // namespace facebook
