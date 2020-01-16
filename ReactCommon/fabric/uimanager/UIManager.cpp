/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UIManager.h"

#include <react/core/ShadowNodeFragment.h>
#include <react/debug/SystraceSection.h>
#include <react/graphics/Geometry.h>

#include <glog/logging.h>

namespace facebook {
namespace react {

UIManager::~UIManager() {
  LOG(WARNING) << "UIManager::~UIManager() was called (address: " << this
               << ").";
}

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
      ShadowNodeFragment{props}, surfaceId);

  auto shadowNode = componentDescriptor.createShadowNode(
      ShadowNodeFragment{
          /* .props = */
          fallbackDescriptor != nullptr &&
                  fallbackDescriptor->getComponentHandle() ==
                      componentDescriptor.getComponentHandle()
              ? componentDescriptor.cloneProps(
                    props, RawProps(folly::dynamic::object("name", name)))
              : props,
          /* .children = */ ShadowNodeFragment::childrenPlaceholder(),
          /* .localData = */ ShadowNodeFragment::localDataPlaceholder(),
          /* .state = */ state,
      },
      ShadowNodeFamilyFragment{tag, surfaceId, eventEmitter});

  // state->commit(x) associates a ShadowNode with the State object.
  // state->commit(x) must be called before calling updateState; updateState
  // fails silently otherwise. In between "now", when this node is created, and
  // when this node is actually committed, the State object would otherwise not
  // have any reference back to the ShadowNode that owns it. On platforms that
  // do view preallocation (like Android), this State would be sent to the
  // mounting layer with valid data but without an update mechanism. We
  // explicitly associate the ShadowNode with the State here so that updateState
  // is always safe and effectful.
  if (state) {
    state->commit(shadowNode);
  }

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
          /* .props = */
          rawProps ? componentDescriptor.cloneProps(
                         shadowNode->getProps(), *rawProps)
                   : ShadowNodeFragment::propsPlaceholder(),
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

  shadowTreeRegistry_.visit(surfaceId, [&](ShadowTree const &shadowTree) {
    shadowTree.commit([&](RootShadowNode::Shared const &oldRootShadowNode) {
      return std::make_shared<RootShadowNode>(
          *oldRootShadowNode,
          ShadowNodeFragment{
              /* .props = */ ShadowNodeFragment::propsPlaceholder(),
              /* .children = */ rootChildren,
          });
    });
  });
}

void UIManager::setJSResponder(
    const SharedShadowNode &shadowNode,
    const bool blockNativeResponder) const {
  if (delegate_) {
    delegate_->uiManagerDidSetJSResponder(
        shadowNode->getSurfaceId(), shadowNode, blockNativeResponder);
  }
}

void UIManager::clearJSResponder() const {
  if (delegate_) {
    delegate_->uiManagerDidClearJSResponder();
  }
}

ShadowNode::Shared UIManager::findNodeAtPoint(
    const ShadowNode::Shared &node,
    Point point) const {
  return LayoutableShadowNode::findNodeAtPoint(node, point);
}

void UIManager::setNativeProps(
    ShadowNode const &shadowNode,
    RawProps const &rawProps) const {
  SystraceSection s("UIManager::setNativeProps");

  auto &componentDescriptor = shadowNode.getComponentDescriptor();
  auto props = componentDescriptor.cloneProps(shadowNode.getProps(), rawProps);

  shadowTreeRegistry_.visit(
      shadowNode.getSurfaceId(), [&](ShadowTree const &shadowTree) {
        shadowTree.tryCommit(
            [&](RootShadowNode::Shared const &oldRootShadowNode) {
              return oldRootShadowNode->clone(
                  shadowNode, [&](ShadowNode const &oldShadowNode) {
                    return oldShadowNode.clone({
                        /* .props = */ props,
                    });
                  });
            });
      });
}

LayoutMetrics UIManager::getRelativeLayoutMetrics(
    ShadowNode const &shadowNode,
    ShadowNode const *ancestorShadowNode,
    LayoutableShadowNode::LayoutInspectingPolicy policy) const {
  SystraceSection s("UIManager::getRelativeLayoutMetrics");

  if (!ancestorShadowNode) {
    shadowTreeRegistry_.visit(
        shadowNode.getSurfaceId(), [&](ShadowTree const &shadowTree) {
          shadowTree.tryCommit(
              [&](RootShadowNode::Shared const &oldRootShadowNode) {
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
      *layoutableAncestorShadowNode, policy);
}

void UIManager::updateState(
    ShadowNode const &shadowNode,
    StateData::Shared const &rawStateData) const {
  auto &componentDescriptor = shadowNode.getComponentDescriptor();
  auto state =
      componentDescriptor.createState(shadowNode.getState(), rawStateData);

  shadowTreeRegistry_.visit(
      shadowNode.getSurfaceId(), [&](ShadowTree const &shadowTree) {
        shadowTree.tryCommit([&](RootShadowNode::Shared const
                                     &oldRootShadowNode) {
          return oldRootShadowNode->clone(
              shadowNode, [&](ShadowNode const &oldShadowNode) {
                return oldShadowNode.clone({
                    /* .props = */ ShadowNodeFragment::propsPlaceholder(),
                    /* .children = */ ShadowNodeFragment::childrenPlaceholder(),
                    /* .localData = */
                    ShadowNodeFragment::localDataPlaceholder(),
                    /* .state = */ state,
                });
              });
        });
      });
}

void UIManager::dispatchCommand(
    const SharedShadowNode &shadowNode,
    std::string const &commandName,
    folly::dynamic const args) const {
  if (delegate_) {
    delegate_->uiManagerDidDispatchCommand(shadowNode, commandName, args);
  }
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

void UIManager::visitBinding(
    std::function<void(UIManagerBinding const &uiManagerBinding)> callback)
    const {
  if (!uiManagerBinding_) {
    return;
  }

  callback(*uiManagerBinding_);
}

ShadowTreeRegistry const &UIManager::getShadowTreeRegistry() const {
  return shadowTreeRegistry_;
}

#pragma mark - ShadowTreeDelegate

void UIManager::shadowTreeDidFinishTransaction(
    ShadowTree const &shadowTree,
    MountingCoordinator::Shared const &mountingCoordinator) const {
  SystraceSection s("UIManager::shadowTreeDidFinishTransaction");

  if (delegate_) {
    delegate_->uiManagerDidFinishTransaction(mountingCoordinator);
  }
}

} // namespace react
} // namespace facebook
