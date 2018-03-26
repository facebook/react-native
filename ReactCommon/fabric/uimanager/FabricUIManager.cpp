/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FabricUIManager.h"

#include <glog/logging.h>

#include <fabric/core/LayoutContext.h>
#include <fabric/view/ViewComponentDescriptor.h>
#include <fabric/view/ViewProps.h>
#include <fabric/view/ViewShadowNode.h>

#include "IFabricPlatformUIOperationManager.h"

namespace facebook {
namespace react {

static const RawProps rawPropsFromDynamic(const folly::dynamic object) {
  // TODO: Convert this to something smarter, probably returning `std::iterator`.
  RawProps result;

  if (object.isNull()) {
    return result;
  }

  assert(object.isObject());

  for (const auto &pair : object.items()) {
    assert(pair.first.isString());
    result[pair.first.asString()] = pair.second;
  }

  return result;
}

FabricUIManager::FabricUIManager(const std::shared_ptr<IFabricPlatformUIOperationManager> &platformUIOperationManager):
  platformUIOperationManager_(platformUIOperationManager) {

  SharedComponentDescriptor viewComponentDescriptor = std::make_shared<ViewComponentDescriptor>();
  _registry.registerComponentDescriptor(viewComponentDescriptor);
}

SharedShadowNode FabricUIManager::createNode(int tag, std::string viewName, int rootTag, folly::dynamic props, void *instanceHandle) {
  LOG(INFO) << "FabricUIManager::createNode(tag: " << tag << ", name: " << viewName << ", rootTag" << rootTag << ", props: " << props << ")";
  ComponentDescriptor &componentDescriptor = *_registry["View"];
  RawProps rawProps = rawPropsFromDynamic(props);
  SharedShadowNode shadowNode = componentDescriptor.createShadowNode(tag, rootTag, instanceHandle, rawProps);
  LOG(INFO) << "FabricUIManager::createNode() -> " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false});
  return shadowNode;
}

SharedShadowNode FabricUIManager::cloneNode(const SharedShadowNode &shadowNode) {
  LOG(INFO) << "FabricUIManager::cloneNode(shadowNode: " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ")";
  ComponentDescriptor &componentDescriptor = *_registry[shadowNode];
  SharedShadowNode clonnedShadowNode = componentDescriptor.cloneShadowNode(shadowNode);
  LOG(INFO) << "FabricUIManager::cloneNode() -> " << clonnedShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false});
  return clonnedShadowNode;
}

SharedShadowNode FabricUIManager::cloneNodeWithNewChildren(const SharedShadowNode &shadowNode) {
  LOG(INFO) << "FabricUIManager::cloneNodeWithNewChildren(shadowNode: " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ")";
  // Assuming semantic: Cloning with same props but empty children.
  ComponentDescriptor &componentDescriptor = *_registry[shadowNode];
  SharedShadowNode clonnedShadowNode = componentDescriptor.cloneShadowNode(shadowNode, nullptr, {});
  LOG(INFO) << "FabricUIManager::cloneNodeWithNewChildren() -> " << clonnedShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false});
  return clonnedShadowNode;
}

SharedShadowNode FabricUIManager::cloneNodeWithNewProps(const SharedShadowNode &shadowNode, folly::dynamic props) {
  LOG(INFO) << "FabricUIManager::cloneNodeWithNewProps(shadowNode: " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ", props: " << props << ")";
  // Assuming semantic: Cloning with same children and specified props.
  ComponentDescriptor &componentDescriptor = *_registry[shadowNode];
  RawProps rawProps = rawPropsFromDynamic(props);
  SharedShadowNode clonnedShadowNode = componentDescriptor.cloneShadowNode(shadowNode, std::make_shared<const RawProps>(rawProps), nullptr);
  LOG(INFO) << "FabricUIManager::cloneNodeWithNewProps() -> " << clonnedShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false});
  return clonnedShadowNode;
}

SharedShadowNode FabricUIManager::cloneNodeWithNewChildrenAndProps(const SharedShadowNode &shadowNode, folly::dynamic props) {
  LOG(INFO) << "FabricUIManager::cloneNodeWithNewChildrenAndProps(shadowNode: " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ", props: " << props << ")";
  // Assuming semantic: Cloning with empty children and specified props.
  ComponentDescriptor &componentDescriptor = *_registry[shadowNode];
  RawProps rawProps = rawPropsFromDynamic(props);
  SharedShadowNode clonnedShadowNode = componentDescriptor.cloneShadowNode(shadowNode, std::make_shared<const RawProps>(rawProps), {});
  LOG(INFO) << "FabricUIManager::cloneNodeWithNewChildrenAndProps() -> " << clonnedShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false});
  return clonnedShadowNode;
}

void FabricUIManager::appendChild(const SharedShadowNode &parentShadowNode, const SharedShadowNode &childShadowNode) {
  LOG(INFO) << "FabricUIManager::appendChild(parentShadowNode: " << parentShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ", childShadowNode: " << childShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ")";
  ComponentDescriptor &componentDescriptor = *_registry[parentShadowNode];
  componentDescriptor.appendChild(parentShadowNode, childShadowNode);
}

SharedShadowNodeUnsharedList FabricUIManager::createChildSet(int rootTag) {
  LOG(INFO) << "FabricUIManager::createChildSet(rootTag: " << rootTag << ")";
  return std::make_shared<SharedShadowNodeList>(SharedShadowNodeList({}));
}

void FabricUIManager::appendChildToSet(const SharedShadowNodeUnsharedList &shadowNodeList, const SharedShadowNode &shadowNode) {
  LOG(INFO) << "FabricUIManager::appendChildToSet(shadowNodeList: " << shadowNodeList << ", shadowNode: " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ")";
  shadowNodeList->push_back(shadowNode);
}

void FabricUIManager::completeRoot(int rootTag, const SharedShadowNodeUnsharedList &children) {
  LOG(INFO) << "FabricUIManager::appendChildToSet(rootTag: " << rootTag << ", shadowNodeList: " << children << ")";
  ComponentDescriptor &componentDescriptor = *_registry["View"];
  SharedShadowNode previousRootShadowNode = componentDescriptor.createShadowNode(rootTag, rootTag, nullptr, {});
  auto childrenCopy = std::make_shared<const SharedShadowNodeList>(SharedShadowNodeList(*children));
  SharedShadowNode rootShadowNode = componentDescriptor.cloneShadowNode(previousRootShadowNode, nullptr, childrenCopy);

  SharedViewShadowNode viewShadowNode = std::dynamic_pointer_cast<const ViewShadowNode>(rootShadowNode);
  LayoutContext layoutContext = LayoutContext();
  layoutContext.affectedShadowNodes = std::make_shared<std::unordered_set<SharedLayoutableShadowNode>>();

  LOG(INFO) << "Shadow tree *before* layout: \n" << viewShadowNode->getDebugDescription() ;

  auto nonConstViewShadowNode = std::const_pointer_cast<ViewShadowNode>(viewShadowNode);
  nonConstViewShadowNode->layout(layoutContext);

  rootShadowNode->sealRecursive();

  LOG(INFO) << "Shadow tree *after* layout: \n" << nonConstViewShadowNode->getDebugDescription();
}

} // namespace react
} // namespace facebook
