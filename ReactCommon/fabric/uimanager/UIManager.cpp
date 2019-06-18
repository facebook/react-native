// Copyright 2004-present Facebook. All Rights Reserved.

#include "UIManager.h"

#include <react/core/ShadowNodeFragment.h>
#include <react/debug/SystraceSection.h>

namespace facebook {
namespace react {

SharedShadowNode UIManager::createNode(
    Tag tag,
    std::string const &name,
    SurfaceId surfaceId,
    const RawProps &rawProps,
    SharedEventTarget eventTarget) const {
  SystraceSection s("UIManager::createNode");

  auto &componentDescriptor = componentDescriptorRegistry_->at(name);
  auto fallbackDescriptor =
      componentDescriptorRegistry_->getFallbackComponentDescriptor();

  auto const eventEmitter =
      componentDescriptor.createEventEmitter(std::move(eventTarget), tag);
  auto const props = componentDescriptor.cloneProps(nullptr, rawProps);
  auto const state = componentDescriptor.createInitialState(
      ShadowNodeFragment{surfaceId, tag, props, eventEmitter});

  auto shadowNode = componentDescriptor.createShadowNode({
      /* .tag = */ tag,
      /* .surfaceId = */ surfaceId,
      /* .props = */
      fallbackDescriptor != nullptr &&
              fallbackDescriptor->getComponentHandle() ==
                  componentDescriptor.getComponentHandle()
          ? componentDescriptor.cloneProps(
                props, RawProps(folly::dynamic::object("name", name)))
          : props,
      /* .eventEmitter = */ eventEmitter,
      /* .children = */ ShadowNodeFragment::childrenPlaceholder(),
      /* .localData = */ ShadowNodeFragment::localDataPlaceholder(),
      /* .state = */ state,
  });

  if (delegate_) {
    delegate_->uiManagerDidCreateShadowNode(shadowNode);
  }

  return shadowNode;
}

SharedShadowNode UIManager::cloneNode(
    const SharedShadowNode &shadowNode,
    const SharedShadowNodeSharedList &children,
    const RawProps *rawProps) const {
  SystraceSection s("UIManager::cloneNode");

  auto &componentDescriptor = shadowNode->getComponentDescriptor();
  auto clonedShadowNode = componentDescriptor.cloneShadowNode(
      *shadowNode,
      {
          /* .tag = */ ShadowNodeFragment::tagPlaceholder(),
          /* .surfaceId = */ ShadowNodeFragment::surfaceIdPlaceholder(),
          /* .props = */
          rawProps ? componentDescriptor.cloneProps(
                         shadowNode->getProps(), *rawProps)
                   : ShadowNodeFragment::propsPlaceholder(),
          /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
          /* .children = */ children,
      });

  return clonedShadowNode;
}

void UIManager::appendChild(
    const SharedShadowNode &parentShadowNode,
    const SharedShadowNode &childShadowNode) const {
  SystraceSection s("UIManager::appendChild");

  auto &componentDescriptor = parentShadowNode->getComponentDescriptor();
  componentDescriptor.appendChild(parentShadowNode, childShadowNode);
}

void UIManager::completeSurface(
    SurfaceId surfaceId,
    const SharedShadowNodeUnsharedList &rootChildren) const {
  SystraceSection s("UIManager::completeSurface");

  if (delegate_) {
    delegate_->uiManagerDidFinishTransaction(surfaceId, rootChildren);
  }
}

void UIManager::setNativeProps(
    const SharedShadowNode &shadowNode,
    const RawProps &rawProps) const {
  SystraceSection s("UIManager::setNativeProps");

  auto &componentDescriptor = shadowNode->getComponentDescriptor();
  auto props = componentDescriptor.cloneProps(shadowNode->getProps(), rawProps);
  auto newShadowNode = shadowNode->clone({
      /* .tag = */ ShadowNodeFragment::tagPlaceholder(),
      /* .surfaceId = */ ShadowNodeFragment::surfaceIdPlaceholder(),
      /* .props = */ props,
  });

  shadowTreeRegistry_->visit(
      shadowNode->getSurfaceId(), [&](const ShadowTree &shadowTree) {
        shadowTree.tryCommit(
            [&](const SharedRootShadowNode &oldRootShadowNode) {
              return oldRootShadowNode->clone(shadowNode, newShadowNode);
            });
      });
}

LayoutMetrics UIManager::getRelativeLayoutMetrics(
    const ShadowNode &shadowNode,
    const ShadowNode *ancestorShadowNode) const {
  SystraceSection s("UIManager::getRelativeLayoutMetrics");

  if (!ancestorShadowNode) {
    shadowTreeRegistry_->visit(
        shadowNode.getSurfaceId(), [&](const ShadowTree &shadowTree) {
          shadowTree.tryCommit(
              [&](const SharedRootShadowNode &oldRootShadowNode) {
                ancestorShadowNode = oldRootShadowNode.get();
                return nullptr;
              });
        });
  }

  auto layoutableShadowNode =
      dynamic_cast<const LayoutableShadowNode *>(&shadowNode);
  auto layoutableAncestorShadowNode =
      dynamic_cast<const LayoutableShadowNode *>(ancestorShadowNode);

  if (!layoutableShadowNode || !layoutableAncestorShadowNode) {
    return EmptyLayoutMetrics;
  }

  return layoutableShadowNode->getRelativeLayoutMetrics(
      *layoutableAncestorShadowNode);
}

void UIManager::updateState(
    const SharedShadowNode &shadowNode,
    const StateData::Shared &rawStateData) const {
  auto &componentDescriptor = shadowNode->getComponentDescriptor();
  auto state =
      componentDescriptor.createState(shadowNode->getState(), rawStateData);
  auto newShadowNode = shadowNode->clone({
      /* .tag = */ ShadowNodeFragment::tagPlaceholder(),
      /* .surfaceId = */ ShadowNodeFragment::surfaceIdPlaceholder(),
      /* .props = */ ShadowNodeFragment::propsPlaceholder(),
      /* .eventEmitter = */ ShadowNodeFragment::eventEmitterPlaceholder(),
      /* .children = */ ShadowNodeFragment::childrenPlaceholder(),
      /* .localData = */ ShadowNodeFragment::localDataPlaceholder(),
      /* .state = */ state,
  });

  shadowTreeRegistry_->visit(
      shadowNode->getSurfaceId(), [&](const ShadowTree &shadowTree) {
        shadowTree.tryCommit(
            [&](const SharedRootShadowNode &oldRootShadowNode) {
              return oldRootShadowNode->clone(shadowNode, newShadowNode);
            });
      });
}

void UIManager::setShadowTreeRegistry(ShadowTreeRegistry *shadowTreeRegistry) {
  shadowTreeRegistry_ = shadowTreeRegistry;
}

void UIManager::setComponentDescriptorRegistry(
    const SharedComponentDescriptorRegistry &componentDescriptorRegistry) {
  componentDescriptorRegistry_ = componentDescriptorRegistry;
}

void UIManager::setDelegate(UIManagerDelegate *delegate) {
  delegate_ = delegate;
}

UIManagerDelegate *UIManager::getDelegate() {
  return delegate_;
}

} // namespace react
} // namespace facebook
