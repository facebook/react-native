/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FabricUIManager.h"

#include <glog/logging.h>

#include <fabric/components/view/ViewComponentDescriptor.h>
#include <fabric/components/view/ViewProps.h>
#include <fabric/components/view/ViewShadowNode.h>
#include <fabric/core/LayoutContext.h>
#include <fabric/core/ShadowNodeFragment.h>
#include <fabric/core/componentDescriptor.h>
#include <fabric/debug/DebugStringConvertible.h>
#include <fabric/debug/DebugStringConvertibleItem.h>

namespace facebook {
namespace react {

static const RawProps rawPropsFromDynamic(const folly::dynamic object) {
  // TODO: Convert this to something smarter, probably returning
  // `std::iterator`.
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

FabricUIManager::FabricUIManager(
    std::unique_ptr<EventBeatBasedExecutor> executor,
    std::function<UIManagerInstaller> installer,
    std::function<UIManagerUninstaller> uninstaller)
    : executor_(std::move(executor)),
      installer_(std::move(installer)),
      uninstaller_(std::move(uninstaller)) {
  (*executor_)([this] { installer_(*this); });
}

FabricUIManager::~FabricUIManager() {
  // We move `executor_` and `uninstaller_` inside a lambda to extend their
  // life-time until the lambda finishes.
  auto executor = std::shared_ptr<EventBeatBasedExecutor>{std::move(executor_)};
  auto uninstaller = std::move(uninstaller_);

  (*executor)([uninstaller, executor]() { uninstaller(); });
}

void FabricUIManager::setComponentDescriptorRegistry(
    const SharedComponentDescriptorRegistry &componentDescriptorRegistry) {
  componentDescriptorRegistry_ = componentDescriptorRegistry;
}

void FabricUIManager::setDelegate(UIManagerDelegate *delegate) {
  delegate_ = delegate;
}

UIManagerDelegate *FabricUIManager::getDelegate() {
  return delegate_;
}

void FabricUIManager::setDispatchEventToEmptyTargetFunction(
    std::function<DispatchEventToEmptyTargetFunction> dispatchEventFunction) {
  dispatchEventToEmptyTargetFunction_ = dispatchEventFunction;
}

void FabricUIManager::setDispatchEventToTargetFunction(
    std::function<DispatchEventToTargetFunction> dispatchEventFunction) {
  dispatchEventToTargetFunction_ = dispatchEventFunction;
}

void FabricUIManager::setStartSurfaceFunction(
    std::function<StartSurface> startSurfaceFunction) {
  startSurfaceFunction_ = startSurfaceFunction;
}

void FabricUIManager::setStopSurfaceFunction(
    std::function<StopSurface> stopSurfaceFunction) {
  stopSurfaceFunction_ = stopSurfaceFunction;
}

void FabricUIManager::dispatchEventToTarget(
    jsi::Runtime &runtime,
    const EventTarget *eventTarget,
    const std::string &type,
    const folly::dynamic &payload) const {
  if (eventTarget) {
    dispatchEventToTargetFunction_(
        *eventHandler_,
        *eventTarget,
        const_cast<std::string &>(type),
        const_cast<folly::dynamic &>(payload));
  } else {
    dispatchEventToEmptyTargetFunction_(
        *eventHandler_,
        const_cast<std::string &>(type),
        const_cast<folly::dynamic &>(payload));
  }
}

void FabricUIManager::startSurface(
    SurfaceId surfaceId,
    const std::string &moduleName,
    const folly::dynamic &initialProps) const {
  (*executor_)([this, surfaceId, moduleName, initialProps] {
    startSurfaceFunction_(surfaceId, moduleName, initialProps);
  });
}

void FabricUIManager::stopSurface(SurfaceId surfaceId) const {
  (*executor_)([this, surfaceId] { stopSurfaceFunction_(surfaceId); });
}

SharedShadowNode FabricUIManager::createNode(
    int tag,
    std::string viewName,
    int rootTag,
    folly::dynamic props,
    SharedEventTarget eventTarget) const {
  SharedShadowNode shadowNode = componentDescriptorRegistry_->createNode(
      tag, viewName, rootTag, props, eventTarget);
  if (delegate_) {
    delegate_->uiManagerDidCreateShadowNode(shadowNode);
  }
  return shadowNode;
}

SharedShadowNode FabricUIManager::cloneNode(
    const SharedShadowNode &shadowNode) const {
  const SharedComponentDescriptor &componentDescriptor =
      (*componentDescriptorRegistry_)[shadowNode];

  SharedShadowNode clonedShadowNode =
      componentDescriptor->cloneShadowNode(*shadowNode, {});

  return clonedShadowNode;
}

SharedShadowNode FabricUIManager::cloneNodeWithNewChildren(
    const SharedShadowNode &shadowNode) const {
  // Assuming semantic: Cloning with same props but empty children.
  const SharedComponentDescriptor &componentDescriptor =
      (*componentDescriptorRegistry_)[shadowNode];

  SharedShadowNode clonedShadowNode = componentDescriptor->cloneShadowNode(
      *shadowNode, {.children = ShadowNode::emptySharedShadowNodeSharedList()});

  return clonedShadowNode;
}

SharedShadowNode FabricUIManager::cloneNodeWithNewProps(
    const SharedShadowNode &shadowNode,
    folly::dynamic props) const {
  // Assuming semantic: Cloning with same children and specified props.
  const SharedComponentDescriptor &componentDescriptor =
      (*componentDescriptorRegistry_)[shadowNode];
  RawProps rawProps = rawPropsFromDynamic(props);

  SharedShadowNode clonedShadowNode = componentDescriptor->cloneShadowNode(
      *shadowNode,
      {.props =
           componentDescriptor->cloneProps(shadowNode->getProps(), rawProps)});

  return clonedShadowNode;
}

SharedShadowNode FabricUIManager::cloneNodeWithNewChildrenAndProps(
    const SharedShadowNode &shadowNode,
    folly::dynamic props) const {
  // Assuming semantic: Cloning with empty children and specified props.
  const SharedComponentDescriptor &componentDescriptor =
      (*componentDescriptorRegistry_)[shadowNode];
  RawProps rawProps = rawPropsFromDynamic(props);

  SharedShadowNode clonedShadowNode = componentDescriptor->cloneShadowNode(
      *shadowNode,
      {.props =
           componentDescriptor->cloneProps(shadowNode->getProps(), rawProps),
       .children = ShadowNode::emptySharedShadowNodeSharedList()});

  return clonedShadowNode;
}

void FabricUIManager::appendChild(
    const SharedShadowNode &parentShadowNode,
    const SharedShadowNode &childShadowNode) const {
  const SharedComponentDescriptor &componentDescriptor =
      (*componentDescriptorRegistry_)[parentShadowNode];
  componentDescriptor->appendChild(parentShadowNode, childShadowNode);
}

SharedShadowNodeUnsharedList FabricUIManager::createChildSet(
    int rootTag) const {
  return std::make_shared<SharedShadowNodeList>(SharedShadowNodeList({}));
}

void FabricUIManager::appendChildToSet(
    const SharedShadowNodeUnsharedList &shadowNodeList,
    const SharedShadowNode &shadowNode) const {
  shadowNodeList->push_back(shadowNode);
}

void FabricUIManager::completeRoot(
    int rootTag,
    const SharedShadowNodeUnsharedList &children) const {
  if (delegate_) {
    delegate_->uiManagerDidFinishTransaction(rootTag, children);
  }
}

void FabricUIManager::registerEventHandler(
    UniqueEventHandler eventHandler) const {
  // Technically, it should be protected by a mutex but regularly it should
  // be safe because it used only during initialization process.
  eventHandler_ = std::move(eventHandler);
}

} // namespace react
} // namespace facebook
