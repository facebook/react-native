/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FabricUIManager.h"

#include <glog/logging.h>

#include <fabric/components/view/ViewComponentDescriptor.h>
#include <fabric/components/view/ViewProps.h>
#include <fabric/components/view/ViewShadowNode.h>
#include <fabric/core/componentDescriptor.h>
#include <fabric/core/LayoutContext.h>
#include <fabric/core/ShadowNodeFragment.h>
#include <fabric/debug/DebugStringConvertible.h>
#include <fabric/debug/DebugStringConvertibleItem.h>

namespace facebook {
namespace react {

// TODO: Kill this flag and remove debug logging.
const bool isLoggingEnabled = false;

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

static const std::string componentNameByReactViewName(std::string viewName) {
  // We need this function only for the transition period;
  // eventually, all names will be unified.

  std::string rctPrefix("RCT");
  if (std::mismatch(rctPrefix.begin(), rctPrefix.end(), viewName.begin()).first == rctPrefix.end()) {
    // If `viewName` has "RCT" prefix, remove it.
    viewName.erase(0, rctPrefix.length());
  }

  // Fabric uses slightly new names for Text components because of differences
  // in semantic.
  if (viewName == "Text") {
    return "Paragraph";
  }
  if (viewName == "VirtualText") {
    return "Text";
  }

  if (viewName == "ImageView") {
    return "Image";
  }

  // We need this temporarly for testing purposes until we have proper
  // implementation of core components.
  if (
    viewName == "SinglelineTextInputView" ||
    viewName == "MultilineTextInputView" ||
    viewName == "RefreshControl" ||
    viewName == "SafeAreaView" ||
    viewName == "ScrollContentView"
  ) {
    return "View";
  }

  return viewName;
}

FabricUIManager::FabricUIManager(SharedComponentDescriptorRegistry componentDescriptorRegistry) {
  componentDescriptorRegistry_ = componentDescriptorRegistry;
}

FabricUIManager::~FabricUIManager() {
  if (eventHandler_) {
    releaseEventHandlerFunction_(eventHandler_);
  }
}

void FabricUIManager::setDelegate(UIManagerDelegate *delegate) {
  delegate_ = delegate;
}

UIManagerDelegate *FabricUIManager::getDelegate() {
  return delegate_;
}

void FabricUIManager::setDispatchEventToEmptyTargetFunction(std::function<DispatchEventToEmptyTargetFunction> dispatchEventFunction) {
  dispatchEventToEmptyTargetFunction_ = dispatchEventFunction;
}

void FabricUIManager::setDispatchEventToTargetFunction(std::function<DispatchEventToTargetFunction> dispatchEventFunction) {
  dispatchEventToTargetFunction_ = dispatchEventFunction;
}

void FabricUIManager::setReleaseEventHandlerFunction(std::function<ReleaseEventHandlerFunction> releaseEventHandlerFunction) {
  releaseEventHandlerFunction_ = releaseEventHandlerFunction;
}

void FabricUIManager::setReleaseEventTargetFunction(std::function<ReleaseEventTargetFunction> releaseEventTargetFunction) {
  releaseEventTargetFunction_ = releaseEventTargetFunction;
}

void FabricUIManager::dispatchEventToEmptyTarget(const std::string &type, const folly::dynamic &payload) const {
  dispatchEventToEmptyTargetFunction_(
    eventHandler_,
    const_cast<std::string &>(type),
    const_cast<folly::dynamic &>(payload)
  );
}

void FabricUIManager::dispatchEventToTarget(const EventTarget &eventTarget, const std::string &type, const folly::dynamic &payload) const {
  dispatchEventToTargetFunction_(
    eventHandler_,
    eventTarget,
    const_cast<std::string &>(type),
    const_cast<folly::dynamic &>(payload)
  );
}

void FabricUIManager::releaseEventTarget(const EventTarget &eventTarget) const {
  releaseEventTargetFunction_(eventTarget);
}

SharedShadowNode FabricUIManager::createNode(int tag, std::string viewName, int rootTag, folly::dynamic props, EventTarget eventTarget) {
  isLoggingEnabled && LOG(INFO) << "FabricUIManager::createNode(tag: " << tag << ", name: " << viewName << ", rootTag: " << rootTag << ", props: " << props << ")";

  ComponentName componentName = componentNameByReactViewName(viewName);
  const SharedComponentDescriptor &componentDescriptor = (*componentDescriptorRegistry_)[componentName];
  RawProps rawProps = rawPropsFromDynamic(props);

  SharedShadowNode shadowNode =
    componentDescriptor->createShadowNode({
      .tag = tag,
      .rootTag = rootTag,
      .eventEmitter = componentDescriptor->createEventEmitter(eventTarget, tag),
      .props = componentDescriptor->cloneProps(nullptr, rawProps)
    });

  isLoggingEnabled && LOG(INFO) << "FabricUIManager::createNode() -> " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false});

  if (delegate_) {
    delegate_->uiManagerDidCreateShadowNode(shadowNode);
  }

  return shadowNode;
}

SharedShadowNode FabricUIManager::cloneNode(const SharedShadowNode &shadowNode) {
  isLoggingEnabled && LOG(INFO) << "FabricUIManager::cloneNode(shadowNode: " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ")";
  const SharedComponentDescriptor &componentDescriptor = (*componentDescriptorRegistry_)[shadowNode];

  SharedShadowNode clonedShadowNode =
    componentDescriptor->cloneShadowNode(*shadowNode, {});

  isLoggingEnabled && LOG(INFO) << "FabricUIManager::cloneNode() -> " << clonedShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false});
  return clonedShadowNode;
}

SharedShadowNode FabricUIManager::cloneNodeWithNewChildren(const SharedShadowNode &shadowNode) {
  isLoggingEnabled && LOG(INFO) << "FabricUIManager::cloneNodeWithNewChildren(shadowNode: " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ")";
  // Assuming semantic: Cloning with same props but empty children.
  const SharedComponentDescriptor &componentDescriptor = (*componentDescriptorRegistry_)[shadowNode];

  SharedShadowNode clonedShadowNode =
    componentDescriptor->cloneShadowNode(
      *shadowNode,
      {
        .children = ShadowNode::emptySharedShadowNodeSharedList()
      }
    );

  isLoggingEnabled && LOG(INFO) << "FabricUIManager::cloneNodeWithNewChildren() -> " << clonedShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false});
  return clonedShadowNode;
}

SharedShadowNode FabricUIManager::cloneNodeWithNewProps(const SharedShadowNode &shadowNode, folly::dynamic props) {
  isLoggingEnabled && LOG(INFO) << "FabricUIManager::cloneNodeWithNewProps(shadowNode: " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ", props: " << props << ")";
  // Assuming semantic: Cloning with same children and specified props.
  const SharedComponentDescriptor &componentDescriptor = (*componentDescriptorRegistry_)[shadowNode];
  RawProps rawProps = rawPropsFromDynamic(props);

  SharedShadowNode clonedShadowNode =
    componentDescriptor->cloneShadowNode(
      *shadowNode,
      {
        .props = componentDescriptor->cloneProps(shadowNode->getProps(), rawProps)
      }
    );

  isLoggingEnabled && LOG(INFO) << "FabricUIManager::cloneNodeWithNewProps() -> " << clonedShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false});
  return clonedShadowNode;
}

SharedShadowNode FabricUIManager::cloneNodeWithNewChildrenAndProps(const SharedShadowNode &shadowNode, folly::dynamic props) {
  isLoggingEnabled && LOG(INFO) << "FabricUIManager::cloneNodeWithNewChildrenAndProps(shadowNode: " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ", props: " << props << ")";
  // Assuming semantic: Cloning with empty children and specified props.
  const SharedComponentDescriptor &componentDescriptor = (*componentDescriptorRegistry_)[shadowNode];
  RawProps rawProps = rawPropsFromDynamic(props);

  SharedShadowNode clonedShadowNode =
    componentDescriptor->cloneShadowNode(
      *shadowNode,
      {
        .props = componentDescriptor->cloneProps(shadowNode->getProps(), rawProps),
        .children = ShadowNode::emptySharedShadowNodeSharedList()
      }
    );

  isLoggingEnabled && LOG(INFO) << "FabricUIManager::cloneNodeWithNewChildrenAndProps() -> " << clonedShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false});
  return clonedShadowNode;
}

void FabricUIManager::appendChild(const SharedShadowNode &parentShadowNode, const SharedShadowNode &childShadowNode) {
  isLoggingEnabled && LOG(INFO) << "FabricUIManager::appendChild(parentShadowNode: " << parentShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ", childShadowNode: " << childShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ")";
  const SharedComponentDescriptor &componentDescriptor = (*componentDescriptorRegistry_)[parentShadowNode];
  componentDescriptor->appendChild(parentShadowNode, childShadowNode);
}

SharedShadowNodeUnsharedList FabricUIManager::createChildSet(int rootTag) {
  isLoggingEnabled && LOG(INFO) << "FabricUIManager::createChildSet(rootTag: " << rootTag << ")";
  return std::make_shared<SharedShadowNodeList>(SharedShadowNodeList({}));
}

void FabricUIManager::appendChildToSet(const SharedShadowNodeUnsharedList &shadowNodeList, const SharedShadowNode &shadowNode) {
  isLoggingEnabled && LOG(INFO) << "FabricUIManager::appendChildToSet(shadowNodeList: " << shadowNodeList << ", shadowNode: " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ")";
  shadowNodeList->push_back(shadowNode);
}

void FabricUIManager::completeRoot(int rootTag, const SharedShadowNodeUnsharedList &children) {
  isLoggingEnabled && LOG(INFO) << "FabricUIManager::completeRoot(rootTag: " << rootTag << ", shadowNodeList: " << children << ")";

  if (delegate_) {
    delegate_->uiManagerDidFinishTransaction(rootTag, children);
  }
}

void FabricUIManager::registerEventHandler(const EventHandler &eventHandler) {
  isLoggingEnabled && LOG(INFO) << "FabricUIManager::registerEventHandler(eventHandler: " << eventHandler << ")";
  eventHandler_ = eventHandler;
}

} // namespace react
} // namespace facebook
