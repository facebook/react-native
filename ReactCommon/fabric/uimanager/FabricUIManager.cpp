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
  ComponentDescriptor &componentDescriptor = *_registry["View"];
  RawProps rawProps = rawPropsFromDynamic(props);
  SharedShadowNode shadowNode = componentDescriptor.createShadowNode(tag, rootTag, instanceHandle, rawProps);
  return shadowNode;
}

SharedShadowNode FabricUIManager::cloneNode(const SharedShadowNode &shadowNode) {
  ComponentDescriptor &componentDescriptor = *_registry[shadowNode];
  return componentDescriptor.cloneShadowNode(shadowNode);
}

SharedShadowNode FabricUIManager::cloneNodeWithNewChildren(const SharedShadowNode &shadowNode) {
  // Assuming semantic: Cloning with same props but empty children.
  ComponentDescriptor &componentDescriptor = *_registry[shadowNode];
  return componentDescriptor.cloneShadowNode(shadowNode, nullptr, {});
}

SharedShadowNode FabricUIManager::cloneNodeWithNewProps(const SharedShadowNode &shadowNode, folly::dynamic props) {
  // Assuming semantic: Cloning with same children and specified props.
  ComponentDescriptor &componentDescriptor = *_registry[shadowNode];
  RawProps rawProps = rawPropsFromDynamic(props);
  return componentDescriptor.cloneShadowNode(shadowNode, std::make_shared<const RawProps>(rawProps), nullptr);
}

SharedShadowNode FabricUIManager::cloneNodeWithNewChildrenAndProps(const SharedShadowNode &shadowNode, folly::dynamic props) {
  // Assuming semantic: Cloning with empty children and specified props.
  ComponentDescriptor &componentDescriptor = *_registry[shadowNode];
  RawProps rawProps = rawPropsFromDynamic(props);
  return componentDescriptor.cloneShadowNode(shadowNode, std::make_shared<const RawProps>(rawProps), {});
}

void FabricUIManager::appendChild(const SharedShadowNode &parentShadowNode, const SharedShadowNode &childShadowNode) {
  ComponentDescriptor &componentDescriptor = *_registry[parentShadowNode];
  componentDescriptor.appendChild(parentShadowNode, childShadowNode);
}

SharedShadowNodeUnsharedList FabricUIManager::createChildSet(int rootTag) {
  return std::make_shared<SharedShadowNodeList>(SharedShadowNodeList({}));
}

void FabricUIManager::appendChildToSet(const SharedShadowNodeUnsharedList &shadowNodeList, const SharedShadowNode &shadowNode) {
  shadowNodeList->push_back(shadowNode);
}

void FabricUIManager::completeRoot(int rootTag, const SharedShadowNodeUnsharedList &children) {
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
