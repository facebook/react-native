// Copyright 2004-present Facebook. All Rights Reserved.

#include "UIManager.h"

#include <react/core/ShadowNodeFragment.h>
#include <react/debug/SystraceSection.h>

namespace facebook {
namespace react {

SharedShadowNode UIManager::createNode(
    Tag tag,
    const ComponentName &name,
    SurfaceId surfaceId,
    const RawProps &rawProps,
    SharedEventTarget eventTarget) const {
  auto &componentDescriptor = componentDescriptorRegistry_->at(name);

  auto shadowNode = componentDescriptor.createShadowNode(
      {.tag = tag,
       .rootTag = surfaceId,
       .eventEmitter =
           componentDescriptor.createEventEmitter(std::move(eventTarget), tag),
       .props = componentDescriptor.cloneProps(nullptr, rawProps)});

  if (delegate_) {
    delegate_->uiManagerDidCreateShadowNode(shadowNode);
  }

  return std::const_pointer_cast<ShadowNode>(shadowNode);
}

SharedShadowNode UIManager::cloneNode(
    const SharedShadowNode &shadowNode,
    const SharedShadowNodeSharedList &children,
    const folly::Optional<RawProps> &rawProps) const {
  auto &componentDescriptor =
      componentDescriptorRegistry_->at(shadowNode->getComponentHandle());

  auto clonedShadowNode = componentDescriptor.cloneShadowNode(
      *shadowNode,
      {
          .props = rawProps.has_value()
              ? componentDescriptor.cloneProps(
                    shadowNode->getProps(), rawProps.value())
              : ShadowNodeFragment::nullSharedProps(),
          .children = children,
      });

  return std::const_pointer_cast<ShadowNode>(clonedShadowNode);
}

void UIManager::appendChild(
    const SharedShadowNode &parentShadowNode,
    const SharedShadowNode &childShadowNode) const {
  auto &componentDescriptor =
      componentDescriptorRegistry_->at(parentShadowNode->getComponentHandle());
  componentDescriptor.appendChild(parentShadowNode, childShadowNode);
}

void UIManager::completeSurface(
    SurfaceId surfaceId,
    const SharedShadowNodeUnsharedList &rootChildren) const {
  SystraceSection s("FabricUIManager::completeSurface");
  if (delegate_) {
    delegate_->uiManagerDidFinishTransaction(surfaceId, rootChildren);
  }
}

LayoutMetrics UIManager::getRelativeLayoutMetrics(
    const ShadowNode &shadowNode,
    const ShadowNode *ancestorShadowNode) const {
  if (!ancestorShadowNode) {
    shadowTreeRegistry_->get(
        shadowNode.getRootTag(), [&](const ShadowTree &shadowTree) {
          ancestorShadowNode = shadowTree.getRootShadowNode().get();
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
